#!/usr/bin/env python3
"""
Gate Watcher — Cremilo pipeline automation
Polls Linear every 5 min, detects status transitions, propagates to downstream
issues, and auto-spawns the right agent the moment an issue becomes Todo.

Reads issue ID map from .docs/gate-watcher-map.json
Logs all actions to .docs/gate-watcher.log
Agent output logs go to .docs/agent-logs/<spawn-key>.log
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

PROJECT_DIR    = Path(__file__).parent.parent
MAP_FILE       = Path(__file__).parent / "gate-watcher-map.json"
LOG_FILE       = Path(__file__).parent / "gate-watcher.log"
STATE_FILE     = Path("/tmp/gate-watcher-state.json")
AGENT_LOGS     = Path(__file__).parent / "agent-logs"
SKILLS_DIR     = PROJECT_DIR / ".claude" / "skills"
PENDING_AGENTS = Path(__file__).parent / "pending-agents.json"
PRD_FILE     = PROJECT_DIR / ".prds" / "0001-monthly-calculator" / "PRD.md"
DESIGN_FILE  = PROJECT_DIR / ".prds" / "0001-monthly-calculator" / "DESIGN.md"

# ── Linear API ────────────────────────────────────────────────────────────────

def _load_linear_key() -> str:
    """Load LINEAR_API_KEY from env or .env.local."""
    key = os.environ.get("LINEAR_API_KEY", "")
    if not key:
        env_file = PROJECT_DIR / ".env.local"
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                if line.startswith("LINEAR_API_KEY="):
                    key = line.split("=", 1)[1].strip()
                    break
    return key

LINEAR_API_KEY = _load_linear_key()
LINEAR_URL     = "https://api.linear.app/graphql"

# Cache: state name → state UUID (populated on first set_status call)
_state_id_cache: dict[str, str] = {}


def _gql(query: str, variables: dict | None = None) -> dict:
    """Execute a Linear GraphQL request. Raises on HTTP/auth errors."""
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        LINEAR_URL,
        data=payload,
        headers={"Authorization": LINEAR_API_KEY, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def _get_state_id(state_name: str, team_id: str) -> str | None:
    """Return the Linear UUID for a state name within a team (cached)."""
    cache_key = f"{team_id}:{state_name}"
    if cache_key in _state_id_cache:
        return _state_id_cache[cache_key]
    data = _gql("""
        query($teamId: String!) {
          team(id: $teamId) { states { nodes { id name } } }
        }
    """, {"teamId": team_id})
    for node in data.get("data", {}).get("team", {}).get("states", {}).get("nodes", []):
        _state_id_cache[f"{team_id}:{node['name']}"] = node["id"]
    return _state_id_cache.get(cache_key)


# ── Logging ──────────────────────────────────────────────────────────────────

def log(msg: str):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


# ── Claude subprocess ─────────────────────────────────────────────────────────

def run_claude(prompt: str, timeout: int = 90) -> str:
    """Blocking claude -p call — used for Linear reads/writes."""
    result = subprocess.run(
        ["claude", "-p", prompt, "--output-format", "text"],
        capture_output=True, text=True, timeout=timeout,
        env={**os.environ, "CLAUDE_USAGE_SKIP": "1"},
    )
    return result.stdout.strip()


# ── Agent spawning ────────────────────────────────────────────────────────────

def read_skill(skill_name: str) -> str:
    f = SKILLS_DIR / f"{skill_name}.md"
    return f.read_text() if f.exists() else ""


def spawn_agent(skill_name: str, spawn_key: str, task_prompt: str, state: dict):
    """
    Queue an agent task by writing to pending-agents.json.
    The Gate Watcher SKILL.md reads this file after each Python run and
    creates a one-time scheduled task for each entry — giving the agent a
    full Claude session with proper auth and MCP access.
    spawn_key is tracked in state so each agent is queued only once.
    """
    if spawn_key in state.get("spawned", []):
        return  # already queued or run

    skill = read_skill(skill_name)
    full_prompt = (
        f"{skill}\n\n---\n\n## Active task\n\n{task_prompt}"
        if skill else task_prompt
    )

    # Load existing pending list
    pending: list[dict] = []
    if PENDING_AGENTS.exists():
        try:
            pending = json.loads(PENDING_AGENTS.read_text())
        except Exception:
            pending = []

    # Append new entry
    pending.append({
        "task_id": spawn_key,
        "type": skill_name,
        "description": f"{skill_name} — {spawn_key}",
        "prompt": full_prompt,
        "status": "pending",
        "queued_at": datetime.now().isoformat(),
    })
    PENDING_AGENTS.write_text(json.dumps(pending, indent=2))

    log(f"  📋 Queued {skill_name} [{spawn_key}] → pending-agents.json")
    state.setdefault("spawned", []).append(spawn_key)


# ── Linear helpers ────────────────────────────────────────────────────────────

# Team + project IDs (Cremilo / Monthly Calculator)
_TEAM_ID    = "5c088e06-e8e8-4311-9da8-19c178bbbba7"
_PROJECT_ID = "e4bb212a-8e3f-4f64-bdd0-18c4b256b8ed"


def fetch_issues() -> list[dict]:
    """Return all issues in the Monthly Calculator project via Linear GraphQL."""
    try:
        data = _gql("""
            query($projectId: String!) {
              project(id: $projectId) {
                issues(first: 100) {
                  nodes {
                    identifier
                    title
                    state { name }
                  }
                }
              }
            }
        """, {"projectId": _PROJECT_ID})
        nodes = (data.get("data") or {}).get("project", {}).get("issues", {}).get("nodes", [])
        return [{"id": n["identifier"], "title": n["title"], "status": n["state"]["name"]} for n in nodes]
    except Exception as e:
        log(f"  WARN: Linear API fetch failed — {e}")
        return []


def fetch_comments(linear_id: str) -> str:
    """Return all comments on an issue as a formatted string, or '' if none."""
    try:
        data = _gql("""
            query($id: String!) {
              issue(id: $id) {
                comments { nodes { body createdAt user { name } } }
              }
            }
        """, {"id": linear_id})
        nodes = (data.get("data") or {}).get("issue", {}).get("comments", {}).get("nodes", [])
        if not nodes:
            return ""
        lines = ["## Feedback comments from Linear\n"]
        for c in nodes:
            author = (c.get("user") or {}).get("name", "unknown")
            lines.append(f"**{author}** ({c.get('createdAt', '')[:10]}):\n{c['body']}\n")
        return "\n".join(lines)
    except Exception as e:
        log(f"  WARN: could not fetch comments for {linear_id} — {e}")
        return ""


REVIEW_SECTION_MARKERS = ("Accessibility review checklist", "Manual review checklist")


def _extract_url(cell: str) -> str | None:
    """Pull a URL out of a markdown table cell — handles markdown link, bare URL, or empty/n-a."""
    import re
    if not cell:
        return None
    if cell.lower() in ("n/a", "n-a", "—", "-", "none"):
        return None
    # Linear renders bare URLs in markdown as `[url](<url>)` — accept optional `<>` wrap.
    m = re.search(r"\[.*?\]\(<?(https?://[^\s>)]+)>?\)", cell)
    if m:
        return m.group(1)
    # Bare URL fallback — stop at whitespace and the link-syntax characters.
    m = re.search(r"(https?://[^\s>\])]+)", cell)
    if m:
        return m.group(1).rstrip(").,")
    return None


def attach_screens_on_approval(linear_id: str) -> int:
    """
    On design approval (D-xx → Done), parse the latest In-Review comment
    (the one containing both review checklists) and create a Linear
    attachment per URL listed in the 'Screens delivered' table.

    Dedupes against existing attachment URLs on the issue.
    Returns the number of attachments created.
    """
    try:
        data = _gql("""
            query($id: String!) {
              issue(id: $id) {
                id
                comments { nodes { body createdAt } }
                attachments { nodes { url } }
              }
            }
        """, {"id": linear_id})
        issue = (data.get("data") or {}).get("issue") or {}
        issue_uuid = issue.get("id")
        if not issue_uuid:
            return 0

        # Find latest comment with both checklists (= an In-Review submission)
        nodes = issue.get("comments", {}).get("nodes", []) or []
        latest_body: str | None = None
        for c in sorted(nodes, key=lambda x: x.get("createdAt", ""), reverse=True):
            body = c.get("body", "") or ""
            if all(m in body for m in REVIEW_SECTION_MARKERS):
                latest_body = body
                break
        if not latest_body:
            log(f"  ⚠️  {linear_id}: no In-Review comment with both checklists — skipping auto-attach")
            return 0

        # Dedupe set
        existing = {a.get("url") for a in (issue.get("attachments", {}).get("nodes", []) or []) if a.get("url")}

        # Walk 'Screens delivered' section; collect (url, title) pairs from table rows.
        # Only top-level '### ' headers gate the section — '#### ' route subheadings
        # (e.g., '#### /login') stay inside the section so their tables get parsed.
        screens: list[tuple[str, str]] = []
        in_section = False
        for line in latest_body.split("\n"):
            stripped = line.strip()
            if stripped.startswith("### ") and not stripped.startswith("#### "):
                in_section = "Screens delivered" in stripped
                continue
            if not in_section or "|" not in stripped:
                continue
            cells = [c.strip() for c in stripped.split("|")]
            if len(cells) < 6:
                continue
            # cells[0] and cells[-1] are empty from leading/trailing |
            resolution = cells[1]
            if not resolution or resolution.lower().startswith(("---", "resolution")):
                continue
            for state_label, idx in (("Initial", 2), ("Error replica", 3), ("Filled replica", 4)):
                url = _extract_url(cells[idx])
                if url and url not in existing:
                    title = f"{resolution} — {state_label}"
                    screens.append((url, title))
                    existing.add(url)

        # Create attachments
        created = 0
        for url, title in screens:
            try:
                _gql("""
                    mutation($issueId: String!, $url: String!, $title: String!) {
                      attachmentCreate(input: { issueId: $issueId, url: $url, title: $title }) {
                        success
                      }
                    }
                """, {"issueId": issue_uuid, "url": url, "title": title})
                created += 1
            except Exception as ee:
                log(f"  ⚠️  failed to attach {url} to {linear_id}: {ee}")
        return created
    except Exception as e:
        log(f"  WARN: could not auto-attach screens for {linear_id} — {e}")
        return 0


def check_review_approved(linear_id: str) -> tuple[bool, list[str]]:
    """
    Inspect the most recent comment on `linear_id` containing BOTH review
    checklists and verify every checkbox is ticked across both:
      - 'Accessibility review checklist'
      - 'Manual review checklist'

    Returns (approved, unchecked_items).
    - approved=True only if a comment is found that contains both checklist
      headings AND no '- [ ]' lines remain under either.
    - approved=False if no qualifying comment exists, any box is unticked,
      either section is missing, or fetch fails. Failing closed is intentional:
      a missing or partial review must block propagation.
    """
    try:
        data = _gql("""
            query($id: String!) {
              issue(id: $id) {
                comments { nodes { body createdAt } }
              }
            }
        """, {"id": linear_id})
        nodes = (data.get("data") or {}).get("issue", {}).get("comments", {}).get("nodes", [])
        latest_body: str | None = None
        for c in sorted(nodes, key=lambda x: x.get("createdAt", ""), reverse=True):
            body = c.get("body", "") or ""
            if all(m in body for m in REVIEW_SECTION_MARKERS):
                latest_body = body
                break
        if not latest_body:
            joined = " AND ".join(f"'{m}'" for m in REVIEW_SECTION_MARKERS)
            return False, [f"No comment found containing both {joined}"]
        unchecked: list[str] = []
        current_section: str | None = None
        for line in latest_body.split("\n"):
            stripped = line.strip()
            if stripped.startswith("#"):
                hit = next((m for m in REVIEW_SECTION_MARKERS if m in stripped), None)
                current_section = hit  # None if heading is outside our two sections
                continue
            if current_section and stripped.startswith("- [ ]"):
                item = stripped[5:].strip()
                unchecked.append(f"[{current_section}] {item}")
        return (len(unchecked) == 0), unchecked
    except Exception as e:
        log(f"  WARN: could not check review for {linear_id} — {e}")
        return False, [f"error fetching comments: {e}"]


def _is_pending_in_queue(spawn_key: str) -> bool:
    """True if spawn_key exists in pending-agents.json with status != 'done'."""
    if not PENDING_AGENTS.exists():
        return False
    try:
        pending = json.loads(PENDING_AGENTS.read_text())
        return any(t.get("task_id") == spawn_key and t.get("status") != "done" for t in pending)
    except Exception:
        return False


REJECTION_KEYWORDS = ("❌", "rework", "rejected", "changes requested", "not approved")


def has_rejection_signal(linear_id: str) -> bool:
    """
    Returns True if the issue's comment history shows a real design rejection:
    - any comment contains explicit rejection keywords, OR
    - the latest review comment has unticked checklist items.
    Returns False for clean-reset transitions (all boxes ticked, no keywords).
    Fails open: if comments can't be fetched, assumes rejection to avoid silently
    dropping a real rework request.
    """
    try:
        data = _gql("""
            query($id: String!) {
              issue(id: $id) {
                comments { nodes { body createdAt } }
              }
            }
        """, {"id": linear_id})
        nodes = (data.get("data") or {}).get("issue", {}).get("comments", {}).get("nodes", [])
        if not nodes:
            return False
        for c in nodes:
            body = (c.get("body") or "").lower()
            if any(kw in body for kw in REJECTION_KEYWORDS):
                return True
        for c in sorted(nodes, key=lambda x: x.get("createdAt", ""), reverse=True):
            body = c.get("body", "") or ""
            if all(m in body for m in REVIEW_SECTION_MARKERS):
                return "- [ ]" in body
        return False
    except Exception as e:
        log(f"  WARN: could not check rejection signal for {linear_id} — {e}")
        return True  # fail open


def get_status(linear_id: str, issues: list[dict]) -> str | None:
    for issue in issues:
        if issue.get("id") == linear_id:
            return issue.get("status")
    return None


# PRIORITY RULE: Never set Urgent (priority=1). Maximum is High (priority=2).
# Urgent is reserved exclusively for production hotfixes — never for regular pipeline work.
def set_status(linear_id: str, internal_key: str, new_status: str, reason: str):
    log(f"  → {internal_key} ({linear_id}): → {new_status}  [{reason}]")
    try:
        # Resolve issue UUID from identifier (e.g. CRE-15)
        issue_data = _gql("""
            query($id: String!) { issue(id: $id) { id } }
        """, {"id": linear_id})
        issue_uuid = (issue_data.get("data") or {}).get("issue", {}).get("id")
        if not issue_uuid:
            log(f"  ERROR: could not resolve UUID for {linear_id}")
            return
        state_id = _get_state_id(new_status, _TEAM_ID)
        if not state_id:
            log(f"  ERROR: unknown state '{new_status}' for {linear_id}")
            return
        _gql("""
            mutation($id: String!, $stateId: String!, $priority: Int!) {
              issueUpdate(id: $id, input: { stateId: $stateId, priority: $priority }) {
                success
              }
            }
        """, {"id": issue_uuid, "stateId": state_id, "priority": 2})
    except Exception as e:
        log(f"  ERROR updating {linear_id}: {e}")


# ── State ─────────────────────────────────────────────────────────────────────

def load_map() -> dict:
    if not MAP_FILE.exists():
        log("ERROR: gate-watcher-map.json not found")
        sys.exit(1)
    return json.loads(MAP_FILE.read_text())


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state: dict):
    STATE_FILE.write_text(json.dumps(state, indent=2))


# ── Agent task prompts ────────────────────────────────────────────────────────

def prompt_design(key: str, linear_id: str, screen: str, details: str) -> str:
    """Focused prompt for a single design issue — runs in its own parallel agent."""
    comments = fetch_comments(linear_id)
    feedback_section = f"\n\n{comments}" if comments else ""
    revision_note = (
        "\n\nThis is a REVISION — address every point in the feedback above before "
        "moving to In Review.\n"
        "STITCH LIMITATION: The Stitch MCP cannot delete screens. "
        "If the feedback asks for deletions, skip them and instead post a Linear comment "
        "listing the screen URLs to delete, prefixed with "
        "'🗑️ Manual cleanup needed — please delete these screens from Stitch:'. "
        "Use mcp__linear-server__save_comment to post the comment."
        if comments else ""
    )
    return f"""
Gate 0 has been cleared for the Cremilo Monthly Calculator project.
You are working on ONE design issue: {key} ({linear_id}).

Screen: {screen}
{details}{feedback_section}

Design references (read both before starting):
- PRD:    {PRD_FILE}
- DESIGN: {DESIGN_FILE}

Steps:
1. Read the PRD sections relevant to this screen.
2. Read DESIGN.md for the Mondrian neobrutalist style rules (palette, typography, borders, shadows).
3. Use mcp__stitch__* to create or edit the screen. Apply the design system faithfully.
4. Attach the Stitch screen URL(s) to {linear_id} using mcp__linear-server__save_issue (links field).
5. Move {linear_id} to 'In Review' with priority 2 (High) using mcp__linear-server__save_issue.
6. Post a completion comment on {linear_id} using mcp__linear-server__save_comment with this format:

```
✅ Design complete — ready for review

**Screens delivered:**
- [list each screen with its Stitch link]

**What was addressed:**
- [brief bullet list of what was done, e.g. "Fixed color contrast", "Added mobile version"]

🗑️ **Manual cleanup needed — please delete these screens from Stitch:**
- [list any screens requested for deletion, with links — omit this section if none]

---
👉 Move to **Done** to approve and unblock development, or back to **In Progress** with a comment for revision.
```

IMPORTANT:
- This is your ONLY task — do not work on other design issues.
- Never mark the issue as Done yourself. Only 'In Review'.
- If Stitch requires multiple iterations to match the style guide, iterate until it does.
- The Stitch MCP cannot delete screens — list them in the comment instead.{revision_note}
""".strip()


# Design issue catalogue — key → (linear_id, screen title, extra detail)
DESIGN_ISSUES: list[tuple[str, str, str, str]] = [
    ("D-01", "CRE-15", "Auth screens — login + register pages",
     "Two screens: /login (email + password fields, submit CTA) and /register "
     "(email, password, confirm password). Include error state for invalid credentials. "
     "Neobrutalist card layout, thick border input fields."),
    ("D-02", "CRE-16", "App shell — main layout + navigation sidebar",
     "Persistent left sidebar with nav links: Ingresos, Gastos Fijos, Tarjetas, Config. "
     "Active state indicator. Top bar with app title and user avatar/logout. "
     "Main content area with consistent padding."),
    ("D-03", "CRE-17", "Calculator sections overview — tab layout for 3 sections",
     "Tab switcher between Ingresos / Gastos Fijos / Tarjetas inside the main content area. "
     "Show the selected section's DataTable below the tabs. Empty state for no rows."),
    ("D-04", "CRE-21", "DataTable component — reusable table with collapse + row actions",
     "Columns: name, amount (ARS/USD), due date, status. Collapsible rows. "
     "Kebab (⋮) menu per row: Edit, Delete. Add-row button at the bottom. "
     "Vencido rows in red tint, Pagado in green tint. Thick borders, hard drop-shadow on table card."),
    ("D-05", "CRE-22", "ItemForm component — add/edit modal with currency-aware fields",
     "Modal form with: name (text), amount (number), currency toggle (ARS/USD). "
     "When USD selected: show FX rate field and ARS equivalent (read-only calculated). "
     "Due date picker. Save + Cancel buttons. Neobrutalist modal with hard shadow."),
    ("D-06", "CRE-23", "Tarjetas section — credit card installment view",
     "Extends DataTable: extra columns for installments paid / total, remaining debt. "
     "Row status badge: Vencido (red) / Pagado (green) / Al día (neutral). "
     "Summary card at top showing total monthly card cost in ARS."),
    ("D-07", "CRE-27", "Config screen — Rates section",
     "Settings page, Rates sub-section. Shows current USD→ARS exchange rate. "
     "Input to update it manually. Saved indicator. "
     "Section header with bold label and divider in neobrutalist style."),
    ("D-08", "CRE-28", "Config screen — Format section",
     "Format sub-section below Rates. Options: decimal separator (. or ,), "
     "currency symbol position (prefix/suffix), date format (DD/MM/YYYY or MM/DD/YYYY). "
     "Toggle or select controls, consistent with the design system."),
    ("D-09", "CRE-29", "Config screen — Impuesto de Sellos section",
     "Toggle to enable/disable the 1.49% Impuesto de Sellos tax. "
     "When enabled: show calculated tax amount on applicable transactions. "
     "Explanatory label below the toggle. Matches Config section header style from D-07."),
]


def prompt_tl_agent() -> str:
    return f"""
Gate 0 has been cleared for the Cremilo Monthly Calculator project.
Your job is to complete all 6 infrastructure issues in order.

Project root: {PROJECT_DIR}
PRD: {PRD_FILE}

| Key  | Linear | Task |
|------|--------|------|
| I-01 | CRE-18 | Repo + CI — Next.js 15, pnpm, Node 22 via Volta, GitHub Actions |
| I-02 | CRE-19 | Supabase project — create, get credentials, add to .env.local |
| I-03 | CRE-24 | Auth schema + RLS — users table, email/password, row-level security |
| I-04 | CRE-25 | TanStack Query — install, QueryClient, wrap app in provider |
| I-05 | CRE-26 | Data schema + RLS — ingresos, gastos_fijos, tarjetas tables |
| I-06 | CRE-30 | nequi audit — verify design system tokens work with CSS Modules |

For EACH issue:
1. Do the work (create files, run commands, validate).
2. Move the Linear issue to **'Done'** when complete using mcp__linear-server__save_issue.
3. Post a completion comment using mcp__linear-server__save_comment:
   ```
   ✅ TL Agent — [KEY] complete

   **What was done:** [brief description]
   **Validation:** [what was tested/verified]
   ```
4. Move on to the next one.

Key constraints:
- pnpm only (never npm or yarn)
- CSS Modules only (no Tailwind, no inline styles)
- @supabase/ssr for auth (never createClient directly in components)
- Never commit .env files
- Never merge your own PRs (leave that to the TL review step)
""".strip()


def prompt_qa_setup() -> str:
    return f"""
Gate 0 has been cleared for the Cremilo Monthly Calculator project.
Your job is to complete Q-01 (CRE-20): set up the E2E test framework.

This is scaffold only — no features exist yet. Just the skeleton.

Project root: {PROJECT_DIR}

Steps:
1. Install Playwright: `pnpm add -D @playwright/test`
2. Create playwright.config.ts targeting VERCEL_URL env var (fallback: http://localhost:3000)
3. Create directory structure:
   - tests/e2e/auth/.gitkeep
   - tests/e2e/tables/.gitkeep
   - tests/e2e/config/.gitkeep
4. Add a single smoke test: tests/e2e/smoke.spec.ts — just verifies the page loads.
5. Add "test:e2e": "playwright test" to package.json scripts.
6. Move CRE-20 to **'Done'** in Linear using mcp__linear-server__save_issue.
7. Post a completion comment on CRE-20 using mcp__linear-server__save_comment:
   ```
   ✅ QA Agent — Q-01 complete

   **What was set up:** Playwright E2E framework scaffolded, smoke test added.
   **Next:** Feature tests will be added as each DEV issue is completed.
   ```

Do not write feature tests yet — those come when features are deployed.
""".strip()


def prompt_fe_a(issue_key: str, linear_id: str, description: str, deps: str) -> str:
    return f"""
Linear issue {issue_key} ({linear_id}) has moved to Todo — this is your task.

{issue_key}: {description}

Project root: {PROJECT_DIR}
PRD: {PRD_FILE}
DESIGN: {DESIGN_FILE}

Dependencies already Done: {deps}

Implementation constraints:
- Next.js 15 App Router (server components where possible, client only when needed)
- @supabase/ssr for any auth/session work (cookie-based, never localStorage)
- TanStack Query for all data fetching (useQuery / useMutation)
- CSS Modules — one .module.css per component file, BEM-like naming
- nequi design system primitives mapped to CSS Module overrides
- No Tailwind, no inline styles, no global class names

When done:
1. Open a PR with a clear description.
2. Move {linear_id} to **'In Review'** in Linear using mcp__linear-server__save_issue.
3. Post a comment on {linear_id} using mcp__linear-server__save_comment:
   ```
   👀 FE-A — {issue_key} ready for review

   **What was implemented:** [brief description]
   **PR:** [PR link]
   **Depends on:** {deps}

   ---
   👉 TL: please review and merge the PR, then move to **Done**.
   ```

Do not merge your own PR.
""".strip()


def prompt_fe_b(issue_key: str, linear_id: str, description: str, deps: str) -> str:
    return f"""
Linear issue {issue_key} ({linear_id}) has moved to Todo — this is your task.

{issue_key}: {description}

Project root: {PROJECT_DIR}
PRD: {PRD_FILE}
DESIGN: {DESIGN_FILE}

Dependencies already Done: {deps}

Implementation constraints:
- React component-first — build isolated, reusable components
- CSS Modules — one .module.css per component, BEM-like naming
- nequi design system: Stitch design token → nequi primitive → CSS Module override
- Neobrutalist Mondrian style: thick borders (2-3px solid #000), box-shadow: 4px 4px 0 #000, no border-radius
- Keyboard accessible — ARIA roles for modals, menus, dropdowns
- No Tailwind, no inline styles

When done:
1. Open a PR with a clear description.
2. Move {linear_id} to **'In Review'** in Linear using mcp__linear-server__save_issue.
3. Post a comment on {linear_id} using mcp__linear-server__save_comment:
   ```
   👀 FE-B — {issue_key} ready for review

   **What was implemented:** [brief description]
   **PR:** [PR link]
   **Depends on:** {deps}

   ---
   👉 TL: please review and merge the PR, then move to **Done**.
   ```

Do not merge your own PR.
""".strip()


def prompt_qa_test(issue_key: str, linear_id: str, description: str, feature_issues: str) -> str:
    return f"""
Linear issue {issue_key} ({linear_id}) has moved to Todo — this is your QA task.

{issue_key}: {description}

Features being tested (now Done): {feature_issues}

Project root: {PROJECT_DIR}
Tests dir: {PROJECT_DIR}/tests/e2e/

Write Playwright E2E tests for this feature:
1. Navigate using the Vercel preview URL (read from VERCEL_URL env var).
2. Cover the happy path and at least one edge case.
3. Use stable selectors (data-testid, ARIA roles) — no brittle CSS class selectors.
4. Each assertion must be explicit (no timing-dependent waits).
5. Run the tests to confirm they pass.
6. If a bug is found, create a Linear bug issue with: steps to reproduce,
   expected vs actual, and a screenshot attached.
7. Move {linear_id} to **'Done'** in Linear when all tests pass.
8. Post a completion comment on {linear_id} using mcp__linear-server__save_comment:

   ✅ QA Agent — {issue_key} complete
   **Tests written:** [list test file(s) created]
   **Coverage:** [happy path + edge cases tested]
   **Bugs found:** [list bug issue keys if any, or "None"]
   All tests pass — issue moved to Done.
""".strip()


# ── Main cycle ────────────────────────────────────────────────────────────────

def run_cycle():
    log("── Cycle start ──────────────────────────────")
    m     = load_map()
    state = load_state()

    issues = fetch_issues()
    if not issues:
        log("── Cycle end: no issues fetched ────────────────────────────")
        return
    log(f"  Fetched {len(issues)} issues")

    def st(key: str) -> str | None:
        lid = m.get(key)
        return get_status(lid, issues) if lid else None

    def is_done(key: str) -> bool:
        return st(key) == "Done"

    def is_todo(key: str) -> bool:
        return st(key) == "Todo"

    def was(key: str, target: str) -> bool:
        return state.get(key) == target

    def just_became(key: str, target: str) -> bool:
        return st(key) == target and not was(key, target)

    actions = 0

    # ── Gate 0 cleared → spawn Design + TL + QA-setup ────────────────────────
    g0_keys = ["G0-1", "G0-2", "G0-3", "G0-4"]
    if all(is_done(k) for k in g0_keys):
        if not state.get("gate0_cleared"):
            log("  ✅ Gate 0 CLEARED")
            state["gate0_cleared"] = True
            actions += 1

        # Spawn all 9 design agents in parallel — one per issue
        for d_key, d_lid, d_screen, d_detail in DESIGN_ISSUES:
            spawn_agent(
                "design-agent",
                f"gate0-design-{d_key.lower()}",
                prompt_design(d_key, d_lid, d_screen, d_detail),
                state,
            )

        # Spawn TL (infra) and QA framework setup in parallel with design
        spawn_agent("tl-agent",  "gate0-tl", prompt_tl_agent(),  state)
        spawn_agent("qa-agent",  "gate0-qa", prompt_qa_setup(),  state)

    # ── Design feedback → re-queue design agent ──────────────────────────────
    # Triggered when a design issue is sent back from In Review → In Progress or Todo.
    # Two guards prevent false-positive redesign queuing on clean-reset transitions:
    #   (b) skip if the initial gate0-design task has never run or is still pending
    #   (a) skip if no explicit rejection signal exists in Linear comments
    for d_key, d_lid, d_screen, d_detail in DESIGN_ISSUES:
        prev = state.get(d_key)
        curr = st(d_key)
        if prev == "In Review" and curr in ("In Progress", "Todo"):
            initial_key = f"gate0-design-{d_key.lower()}"
            if initial_key not in state.get("spawned", []) or _is_pending_in_queue(initial_key):
                log(f"  ⏭️  {d_key} → {curr}: initial design not yet delivered — skipping redesign")
                continue
            if not has_rejection_signal(d_lid):
                log(f"  ⏭️  {d_key} → {curr}: no rejection signal in comments — treating as clean reset")
                continue
            redesign_key = f"redesign-{d_key.lower()}-{datetime.now().strftime('%Y%m%d%H%M')}"
            log(f"  🔄 {d_key} sent back for rework ({prev} → {curr}) — queuing redesign")
            spawn_agent(
                "design-agent",
                redesign_key,
                prompt_design(d_key, d_lid, d_screen, d_detail),
                state,
            )
            actions += 1

    # ── Design approval transition → auto-attach approved screens ───────────
    for d_key, d_lid, _, _ in DESIGN_ISSUES:
        if just_became(d_key, "Done"):
            n = attach_screens_on_approval(d_lid)
            if n:
                log(f"  📎 {d_key} approved → attached {n} screen(s) to {d_lid}")
                actions += 1

    # ── Design approvals → move DEV to Todo ──────────────────────────────────
    design_dev_map = {
        "D-01": ("DEV-01", ["I-04"]),
        "D-02": ("DEV-02", ["I-03"]),
        "D-03": ("DEV-03", ["I-05"]),
        "D-04": ("DEV-04", ["I-06"]),
        "D-05": ("DEV-05", ["I-06"]),
        "D-06": ("DEV-06", ["DEV-05"]),
        "D-07": ("DEV-10", ["I-02"]),
        "D-08": ("DEV-11", ["I-02"]),
        "D-09": ("DEV-12", ["DEV-10"]),
    }
    for d_key, (dev_key, deps) in design_dev_map.items():
        if is_done(d_key) and st(dev_key) == "Backlog" and m.get(dev_key):
            if not all(is_done(dep) for dep in deps):
                pending = [d for d in deps if not is_done(d)]
                log(f"  ⏳ {d_key} done but {dev_key} waiting on: {pending}")
                continue
            approved, unchecked = check_review_approved(m[d_key])
            if not approved:
                log(f"  🚧 {d_key} done but review checklists block {dev_key}: {unchecked}")
                continue
            set_status(m[dev_key], dev_key, "Todo",
                       f"{d_key} approved + Accessibility & Manual review verified + deps met")
            actions += 1

    # ── DEV-04 + DEV-05 done → unlock DEV-07, DEV-08 ────────────────────────
    if is_done("DEV-04") and is_done("DEV-05"):
        for key in ["DEV-07", "DEV-08"]:
            if st(key) == "Backlog" and m.get(key):
                set_status(m[key], key, "Todo", "DEV-04 + DEV-05 done")
                actions += 1

    # ── DEV-04 + DEV-06 done → unlock DEV-09 ────────────────────────────────
    if is_done("DEV-04") and is_done("DEV-06"):
        if st("DEV-09") == "Backlog" and m.get("DEV-09"):
            set_status(m["DEV-09"], "DEV-09", "Todo", "DEV-04 + DEV-06 done")
            actions += 1

    # ── DEV issues Todo → spawn FE-A or FE-B ─────────────────────────────────
    fe_a_issues = {
        "DEV-01": ("CRE-31", "Implement auth screens (login + register) from approved D-01 design",
                   "D-01 (design), I-04 (TanStack Query)"),
        "DEV-02": ("CRE-32", "Implement app shell — main layout, navigation, route groups from D-02",
                   "D-02 (design), I-03 (auth)"),
        "DEV-03": ("CRE-33", "Implement calculator section tabs/layout from D-03",
                   "D-03 (design), I-05 (data schema)"),
        "DEV-13": ("CRE-43", "Implement financial logic utilities — ROI, installment tracking, Impuesto de Sellos (1.49%), ARS/USD conversion",
                   "I-05 (data schema)"),
    }
    fe_b_issues = {
        "DEV-04": ("CRE-34", "Build reusable <DataTable /> component — collapse, kebab menu, add-row from D-04",
                   "D-04 (design), I-06 (nequi audit)"),
        "DEV-05": ("CRE-35", "Build <ItemForm /> component — currency-aware fields, ARS/USD toggle from D-05",
                   "D-05 (design), I-06 (nequi audit)"),
        "DEV-06": ("CRE-36", "Build Tarjetas section — installment tracking, Vencido/Pagado status from D-06",
                   "D-06 (design), DEV-05 (ItemForm)"),
        "DEV-07": ("CRE-37", "Build Ingresos section — wire DataTable + ItemForm to useIngresos hook",
                   "DEV-04, DEV-05 (components)"),
        "DEV-08": ("CRE-38", "Build Gastos Fijos section — wire DataTable + ItemForm to useGastosFijos hook",
                   "DEV-04, DEV-05 (components)"),
        "DEV-09": ("CRE-39", "Build Tarjetas section pages — wire components to useTarjetas hook",
                   "DEV-04, DEV-06 (components)"),
        "DEV-10": ("CRE-40", "Build Config — Rates section from D-07",
                   "D-07 (design), I-02 (Supabase)"),
        "DEV-11": ("CRE-41", "Build Config — Exchange rate input + persistence from D-08",
                   "D-08 (design), I-02 (Supabase)"),
        "DEV-12": ("CRE-42", "Build Config — Impuesto de Sellos toggle from D-09",
                   "D-09 (design), DEV-10 (Config Rates)"),
    }

    for key, (lid, desc, deps) in fe_a_issues.items():
        if is_todo(key) and just_became(key, "Todo"):
            spawn_agent("fe-a-agent", f"dev-{key.lower()}", prompt_fe_a(key, lid, desc, deps), state)
            actions += 1

    for key, (lid, desc, deps) in fe_b_issues.items():
        if is_todo(key) and just_became(key, "Todo"):
            spawn_agent("fe-b-agent", f"dev-{key.lower()}", prompt_fe_b(key, lid, desc, deps), state)
            actions += 1

    # ── Dev done → trigger QA issues ─────────────────────────────────────────
    qa_triggers = {
        "Q-02": (["DEV-01"],          "CRE-46", "E2E: auth flow — register, login, logout"),
        "Q-03": (["DEV-04"],          "CRE-47", "E2E: DataTable — collapse, add, edit, delete rows"),
        "Q-04": (["DEV-05", "DEV-06"],"CRE-48", "E2E: ItemForm — ARS/USD currency switching, Tarjetas form"),
        "Q-05": (["DEV-13"],          "CRE-49", "E2E: Financial logic — ROI, installments, Impuesto de Sellos"),
        "Q-06": (["DEV-10", "DEV-11", "DEV-12"], "CRE-50", "E2E: Config screen — rates, exchange rate persistence, tax toggle"),
    }
    for q_key, (deps, lid, desc) in qa_triggers.items():
        if all(is_done(d) for d in deps) and st(q_key) == "Backlog" and m.get(q_key):
            set_status(m[q_key], q_key, "Todo", f"deps done: {deps}")
            actions += 1

    # ── QA issues Todo → spawn QA agent ──────────────────────────────────────
    qa_spawn = {
        "Q-02": ("CRE-46", "Auth flow — register, login, logout", "DEV-01"),
        "Q-03": ("CRE-47", "DataTable — collapse, add, edit, delete", "DEV-04"),
        "Q-04": ("CRE-48", "ItemForm — ARS/USD switch, Tarjetas form", "DEV-05, DEV-06"),
        "Q-05": ("CRE-49", "Financial logic — ROI, installments, Impuesto de Sellos", "DEV-13"),
        "Q-06": ("CRE-50", "Config screen — rates, exchange rate, tax toggle", "DEV-10, DEV-11, DEV-12"),
    }
    for q_key, (lid, desc, feat) in qa_spawn.items():
        if is_todo(q_key) and just_became(q_key, "Todo"):
            spawn_agent("qa-agent", f"qa-{q_key.lower()}",
                        prompt_qa_test(q_key, lid, desc, feat), state)
            actions += 1

    # ── All DEV-01–13 done → trigger Q-07 full regression ────────────────────
    dev_keys = [f"DEV-{i:02d}" for i in range(1, 14)]
    if all(is_done(k) for k in dev_keys) and st("Q-07") == "Backlog" and m.get("Q-07"):
        set_status(m["Q-07"], "Q-07", "Todo", "All DEV-01–13 done")
        actions += 1

    if is_todo("Q-07") and just_became("Q-07", "Todo"):
        spawn_agent(
            "qa-agent", "qa-q-07",
            prompt_qa_test(
                "Q-07", "CRE-51",
                "Full regression suite — run all E2E tests against staging URL",
                "DEV-01 through DEV-13 (all features)"
            ),
            state,
        )
        actions += 1

    # ── Q-07 done → trigger DEV-14 (staging deploy) ──────────────────────────
    if is_done("Q-07") and st("DEV-14") == "Backlog" and m.get("DEV-14"):
        set_status(m["DEV-14"], "DEV-14", "Todo", "Q-07 full regression passed")
        actions += 1

    if is_todo("DEV-14") and just_became("DEV-14", "Todo"):
        spawn_agent(
            "tl-agent", "dev-dev-14",
            f"""
DEV-14 (CRE-44) has moved to Todo — Q-07 full regression passed.

Your task: deploy the Cremilo Monthly Calculator to Vercel staging.

Project root: {PROJECT_DIR}

Steps:
1. Ensure all feature PRs are merged to main.
2. Trigger a Vercel production deploy (or verify it was triggered by the merge).
3. Smoke-test the staging URL manually (load the app, verify login works).
4. Move CRE-44 to 'Done' in Linear.

This is Gate 2 — the final step before user acceptance.
""".strip(),
            state,
        )
        actions += 1

    # ── Persist current state ─────────────────────────────────────────────────
    new_state = {k: st(k) for k in m.keys()}
    new_state["gate0_cleared"] = state.get("gate0_cleared", False)
    new_state["spawned"]       = state.get("spawned", [])
    save_state(new_state)

    log(f"── Cycle end: {actions} action(s) ─────────────────────────────────")


if __name__ == "__main__":
    run_cycle()
