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
_DOCS_DIR      = Path(__file__).parent
LOG_FILE       = _DOCS_DIR / "gate-watcher.log"
AGENT_LOGS     = _DOCS_DIR / "agent-logs"
SKILLS_DIR     = PROJECT_DIR / ".claude" / "skills"
PENDING_AGENTS = _DOCS_DIR / "pending-agents.json"
DESIGN_FILE    = PROJECT_DIR / "DESIGN.md"

# ── Sub-app selection via --sub-app <slug> ────────────────────────────────────
# Usage:
#   python3 gate-watcher.py                         → uses gate-watcher-config.json (default)
#   python3 gate-watcher.py --sub-app monthly-calc  → uses gate-watcher-config-monthly-calc.json
#   python3 gate-watcher.py --sub-app config        → uses gate-watcher-config-config.json

def _resolve_sub_app() -> tuple[Path, Path, Path]:
    slug = None
    args = sys.argv[1:]
    if "--sub-app" in args:
        idx = args.index("--sub-app")
        if idx + 1 < len(args):
            slug = args[idx + 1]
    if slug:
        cfg_file   = _DOCS_DIR / f"gate-watcher-config-{slug}.json"
        map_file   = _DOCS_DIR / f"gate-watcher-map-{slug}.json"
        state_file = _DOCS_DIR / f"gate-watcher-state-{slug}.json"
    else:
        cfg_file   = _DOCS_DIR / "gate-watcher-config.json"
        map_file   = _DOCS_DIR / "gate-watcher-map.json"
        state_file = _DOCS_DIR / "gate-watcher-state.json"
    return cfg_file, map_file, state_file

CONFIG_FILE, MAP_FILE, STATE_FILE = _resolve_sub_app()


def _load_config() -> dict:
    if not CONFIG_FILE.exists():
        print(f"ERROR: {CONFIG_FILE} not found")
        sys.exit(1)
    return json.loads(CONFIG_FILE.read_text())

cfg = _load_config()

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
    Autonomously spawn a claude -p session for the given agent task.
    Uses subprocess.Popen (non-blocking) so gate-watcher continues polling
    while the agent runs in the background.

    Falls back to pending-agents.json queue if the claude CLI is not found.
    spawn_key is tracked in state so each agent is spawned only once.
    """
    if spawn_key in state.get("spawned", []):
        return  # already spawned or queued

    skill = read_skill(skill_name)
    full_prompt = (
        f"{skill}\n\n---\n\n## Active task\n\n{task_prompt}"
        if skill else task_prompt
    )

    AGENT_LOGS.mkdir(exist_ok=True)
    log_path = AGENT_LOGS / f"{spawn_key}.log"

    try:
        import shutil
        claude_bin = shutil.which("claude")
        if not claude_bin:
            raise FileNotFoundError("claude CLI not found")

        with open(log_path, "w") as log_f:
            proc = subprocess.Popen(
                [claude_bin, "-p", full_prompt, "--dangerously-skip-permissions"],
                stdout=log_f,
                stderr=log_f,
                cwd=str(PROJECT_DIR),
                env={**os.environ, "CLAUDE_USAGE_SKIP": "1"},
            )
        log(f"  🚀 Spawned {skill_name} [{spawn_key}] PID={proc.pid} → {log_path.name}")

    except Exception as e:
        # Fallback: write to pending-agents.json for manual pickup
        log(f"  ⚠️  claude CLI spawn failed ({e}) — falling back to pending-agents.json")
        pending: list[dict] = []
        if PENDING_AGENTS.exists():
            try:
                pending = json.loads(PENDING_AGENTS.read_text())
            except Exception:
                pending = []
        pending.append({
            "task_id": spawn_key,
            "type": skill_name,
            "description": f"{skill_name} — {spawn_key}",
            "prompt": full_prompt,
            "status": "pending",
            "queued_at": datetime.now().isoformat(),
        })
        PENDING_AGENTS.write_text(json.dumps(pending, indent=2))
        log(f"  📋 Queued {skill_name} [{spawn_key}] → pending-agents.json (manual pickup needed)")

    state.setdefault("spawned", []).append(spawn_key)


# ── Linear helpers ────────────────────────────────────────────────────────────

# Team + project IDs (team is fixed; project comes from active sub-app config)
_TEAM_ID    = "5c088e06-e8e8-4311-9da8-19c178bbbba7"
_PROJECT_ID = cfg["project_id"]


def _fetch_project_issues(project_id: str) -> list[dict]:
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
    """, {"projectId": project_id})
    nodes = (data.get("data") or {}).get("project", {}).get("issues", {}).get("nodes", [])
    return [{"id": n["identifier"], "title": n["title"], "status": n["state"]["name"]} for n in nodes]


def fetch_issues() -> list[dict]:
    """Return all issues across all configured projects via Linear GraphQL."""
    try:
        seen: set[str] = set()
        result: list[dict] = []
        for pid in [_PROJECT_ID] + cfg.get("extra_project_ids", []):
            for issue in _fetch_project_issues(pid):
                if issue["id"] not in seen:
                    seen.add(issue["id"])
                    result.append(issue)
        return result
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
                in_section = "screens delivered" in stripped.lower()
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


# ── Slash command helpers ─────────────────────────────────────────────────────

def post_linear_comment(linear_id: str, body: str) -> bool:
    """Post a comment on a Linear issue. Returns True on success."""
    try:
        issue_data = _gql("query($id: String!) { issue(id: $id) { id } }", {"id": linear_id})
        issue_uuid = (issue_data.get("data") or {}).get("issue", {}).get("id")
        if not issue_uuid:
            return False
        _gql("""
            mutation($issueId: String!, $body: String!) {
              commentCreate(input: { issueId: $issueId, body: $body }) {
                success
              }
            }
        """, {"issueId": issue_uuid, "body": body})
        return True
    except Exception as e:
        log(f"  WARN: could not post comment on {linear_id} — {e}")
        return False


def get_latest_slash_command(linear_id: str) -> tuple[str | None, str]:
    """
    Return (command, args) if the latest comment is a slash command, else (None, '').
    Recognized commands: approve, promote, redesign.
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
            return None, ""
        latest = sorted(nodes, key=lambda x: x.get("createdAt", ""), reverse=True)[0]
        body = (latest.get("body") or "").strip()
        for cmd in ("approve", "promote", "redesign"):
            prefix = f"/{cmd}"
            if body == prefix:
                return cmd, ""
            if body.startswith(prefix + "\n") or body.startswith(prefix + " "):
                return cmd, body[len(prefix):].strip()
        return None, ""
    except Exception as e:
        log(f"  WARN: could not fetch latest slash command for {linear_id} — {e}")
        return None, ""


def get_latest_fix_prompt(linear_id: str) -> str:
    """
    Return the fix prompt from the most recent '🔧 `/fix` received' comment on the issue,
    or '' if none found. The GitHub workflow posts this comment when /fix is triggered on a PR.
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
        fix_comments = [
            c for c in nodes
            if "🔧 `/fix` received" in (c.get("body") or "")
        ]
        if not fix_comments:
            return ""
        latest = sorted(fix_comments, key=lambda x: x.get("createdAt", ""), reverse=True)[0]
        body = (latest.get("body") or "")
        # Body format: "🔧 `/fix` received — spawning agent\n\n{prompt}"
        parts = body.split("\n\n", 1)
        return parts[1].strip() if len(parts) > 1 else ""
    except Exception as e:
        log(f"  WARN: could not fetch fix prompt for {linear_id} — {e}")
        return ""


def handle_slash_fix(
    dev_key: str, dev_lid: str, description: str, deps: str,
    agent_type: str, state: dict,
):
    """
    Triggered when a DEV issue moves In Review → In Progress (via GitHub /fix workflow).
    Fetches the fix prompt from the latest Linear fix comment, then re-spawns the FE agent
    with the original task context + the specific feedback to address.
    """
    fix_prompt = get_latest_fix_prompt(dev_lid)
    if not fix_prompt:
        log(f"  ⚠️  {dev_key} In Progress but no /fix comment found — skipping re-spawn")
        return

    fix_key = f"fix-{dev_key.lower()}-{datetime.now().strftime('%Y%m%d%H%M')}"

    task_prompt = f"""
Linear issue {dev_key} ({dev_lid}) was moved back to In Progress by a /fix command on GitHub.

{dev_key}: {description}

Project root: {PROJECT_DIR}
PTS: {cfg["pts_url"]}
DESIGN: {DESIGN_FILE}

Dependencies already Done: {deps}

## Feedback to address

{fix_prompt}

Read AGENTS.md and CLAUDE.md for full stack constraints.

When done:
1. Open a PR with a clear description. In the PR body, add on its own line:
   Closes {dev_lid}
2. Move {dev_lid} to **'In Review'** in Linear using mcp__linear-server__save_issue.
3. Post a comment on {dev_lid} using mcp__linear-server__save_comment:
   ```
   👀 {agent_type.upper()} — {dev_key} re-submitted after fix

   **What was addressed:** [brief description of changes made]
   **PR:** [PR link]
   **Depends on:** {deps}

   ---
   👉 TL: please review and merge the PR, then move to **Done**.
   ```

Do not merge your own PR.
""".strip()

    spawn_agent(agent_type, fix_key, task_prompt, state)
    log(f"  🔧 {dev_key} /fix → re-spawned {agent_type} [{fix_key}]")


def _parse_screens_table(body: str) -> list[tuple[str, str, str, str]]:
    """
    Parse the 'Screens delivered' table from a comment body.
    Returns list of (resolution, initial_url, error_url, filled_url).
    URLs are empty strings when n/a.
    """
    rows: list[tuple[str, str, str, str]] = []
    in_section = False
    for line in body.split("\n"):
        stripped = line.strip()
        if stripped.startswith("### ") and not stripped.startswith("#### "):
            in_section = "screens delivered" in stripped.lower()
            continue
        if not in_section or "|" not in stripped:
            continue
        cells = [c.strip() for c in stripped.split("|")]
        if len(cells) < 4:
            continue
        resolution = cells[1]
        if not resolution or resolution.lower().startswith(("---", "resolution")):
            continue
        # Skip separator rows (all non-empty cells are "---...")
        if all(not c or c.startswith("---") for c in cells[1:-1]):
            continue
        initial = (_extract_url(cells[2]) if len(cells) > 2 else None) or ""
        error   = (_extract_url(cells[3]) if len(cells) > 3 else None) or ""
        filled  = (_extract_url(cells[4]) if len(cells) > 4 else None) or ""
        rows.append((resolution, initial, error, filled))
    return rows


def get_latest_delivery_comment(linear_id: str) -> tuple[int, str | None]:
    """
    Return (version_count, latest_delivery_body) where version_count is the number
    of comments containing 'Screens delivered - v' and latest_delivery_body is the
    most recent such comment's body, or None if none exist.
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
        delivery = [c for c in nodes if "Screens delivered - v" in (c.get("body") or "")]
        if not delivery:
            return 0, None
        latest = sorted(delivery, key=lambda x: x.get("createdAt", ""), reverse=True)[0]
        return len(delivery), latest.get("body")
    except Exception as e:
        log(f"  WARN: could not fetch delivery comments for {linear_id} — {e}")
        return 0, None


def handle_slash_promote(d_key: str, d_lid: str):
    """
    /promote: parse the latest delivery comment, then post the formal review comment
    with both checklists unticked. Does not change issue status.
    """
    version_count, delivery_body = get_latest_delivery_comment(d_lid)
    if not delivery_body:
        post_linear_comment(
            d_lid,
            '❌ `/promote` failed — no "Screens delivered" comment found. '
            "The design agent must deliver screens first.",
        )
        log(f"  ⚠️  {d_key} /promote: no delivery comment found")
        return

    rows = _parse_screens_table(delivery_body)
    if not rows:
        post_linear_comment(
            d_lid,
            "❌ `/promote` failed — could not parse the Screens delivered table. "
            "Check the latest delivery comment format.",
        )
        log(f"  ⚠️  {d_key} /promote: could not parse screens table")
        return

    all_urls = [u for _, i, e, f in rows for u in (i, e, f) if u]
    rep_url = all_urls[0] if all_urls else "(see screens above)"

    def fmt_url(u: str) -> str:
        return u if u else "n/a"

    table_lines = "\n".join(
        f"| {res} | {fmt_url(ini)} | {fmt_url(err)} | {fmt_url(fil)} |"
        for res, ini, err, fil in rows
    )

    body = f"""✅ Design submitted for review — {d_key}

### Screens delivered - v{version_count}

| Resolution | Initial | Error replica | Filled replica |
|---|---|---|---|
{table_lines}

### Accessibility review checklist

**Human reviewer: tick every box before posting `/approve`. Gate-watcher blocks downstream propagation until both checklists are fully ticked.**

- [ ] **6. Color contrast** — verified at: {rep_url}
- [ ] **7. ARIA labels** — verified at: {rep_url}
- [ ] **8. Color-independent state** — verified at: {rep_url}
- [ ] **9. Target size 48×48** — verified at: {rep_url}

### Manual review checklist

**Human reviewer: tick every box before posting `/approve`. Gate-watcher blocks downstream propagation until both checklists are fully ticked.**

- [ ] **2. Above-the-fold information** — verified at: {rep_url}
- [ ] **4. Currency display** — verified at: {rep_url}
- [ ] **5. Action distance** — verified at: {rep_url}

---
👉 Tick every box in BOTH checklists, then post `/approve` to move to Done and unblock development."""

    if post_linear_comment(d_lid, body):
        log(f"  📋 {d_key} /promote → posted formal review comment (v{version_count})")
    else:
        log(f"  ⚠️  {d_key} /promote → failed to post review comment")


def handle_slash_approve(
    d_key: str, d_lid: str,
    design_dev_map: dict, m: dict, issues: list[dict], state: dict,
):
    """
    /approve: validate both checklists are fully ticked, attach screens, move D-XX
    to Done, and propagate DEV-XX to Todo if deps are met.
    """
    approved, unchecked = check_review_approved(d_lid)

    if not approved:
        if len(unchecked) == 1 and "No comment found" in unchecked[0]:
            msg = (
                "❌ `/approve` failed — no review checklist found. "
                "Post `/promote` first to generate the review checklist."
            )
        else:
            items = "\n".join(f"- {item}" for item in unchecked)
            msg = (
                f"❌ `/approve` failed — {len(unchecked)} checklist item(s) not yet ticked:\n\n"
                f"{items}\n\nTick all boxes and post `/approve` again."
            )
        post_linear_comment(d_lid, msg)
        log(f"  ⚠️  {d_key} /approve blocked — {len(unchecked)} unchecked item(s)")
        return

    n = attach_screens_on_approval(d_lid)
    if n:
        log(f"  📎 {d_key} /approve → attached {n} screen(s)")

    set_status(d_lid, d_key, "Done", "/approve — all review checklists verified")

    if d_key in design_dev_map:
        dev_key, deps = design_dev_map[d_key]
        if m.get(dev_key):
            pending_deps = [d for d in deps if get_status(m.get(d, ""), issues) != "Done"]
            if pending_deps:
                log(f"  ⏳ {dev_key} waiting on deps: {pending_deps}")
            elif get_status(m[dev_key], issues) == "Backlog":
                set_status(m[dev_key], dev_key, "Todo",
                           f"{d_key} approved via /approve + deps met")


def handle_slash_redesign(
    d_key: str, d_lid: str, d_screen: str, d_detail: str,
    redesign_prompt: str, state: dict,
):
    """
    /redesign <prompt>: move D-XX to In Progress and spawn design-agent to apply
    the prompt via edit_screens (GEMINI_3_1_PRO). The agent posts 'Screens delivered - v{N}'
    (table only) and moves back to In Review.
    """
    if not redesign_prompt:
        post_linear_comment(
            d_lid,
            "❌ `/redesign` requires a prompt. Usage:\n```\n/redesign\nYour detailed redesign instructions here.\n```",
        )
        log(f"  ⚠️  {d_key} /redesign: empty prompt — skipping")
        return

    version_count, delivery_body = get_latest_delivery_comment(d_lid)
    next_version = version_count + 1

    current_screens_section = ""
    if delivery_body:
        rows = _parse_screens_table(delivery_body)
        if rows:
            lines = ["Current screen URLs (to edit with edit_screens):"]
            for res, ini, err, fil in rows:
                if ini:
                    lines.append(f"  - {res} Initial: {ini}")
                if err:
                    lines.append(f"  - {res} Error replica: {err}")
                if fil:
                    lines.append(f"  - {res} Filled replica: {fil}")
            current_screens_section = "\n".join(lines)

    redesign_key = f"slash-redesign-{d_key.lower()}-{datetime.now().strftime('%Y%m%d%H%M')}"
    set_status(d_lid, d_key, "In Progress", "/redesign command — spawning design-agent")

    task_prompt = f"""
You are handling a /redesign command for design issue {d_key} ({d_lid}).

Screen: {d_screen}
{d_detail}

REDESIGN PROMPT (from human reviewer):
{redesign_prompt}

{current_screens_section}

Steps:
1. For each screen listed above, extract the screen ID from its URL and call
   mcp__stitch__edit_screens with model: "GEMINI_3_1_PRO" and the redesign prompt.
2. After each edit, call mcp__stitch__get_screen to verify that htmlCode.name changed
   from before the edit. If unchanged, note the failure — do not retry more than once
   per screen.
3. Post a comment on {d_lid} using mcp__linear-server__save_comment with this exact format:

🔄 Screens redesigned — {d_key}

### Screens delivered - v{next_version}

| Resolution | Initial | Error replica | Filled replica |
|---|---|---|---|
| 390 (mobile) | {{stitch_url or same stitch_url if edit failed}} | {{stitch_url or n/a}} | {{stitch_url or n/a}} |
| 768 (tablet) | {{stitch_url or same stitch_url if edit failed}} | {{stitch_url or n/a}} | {{stitch_url or n/a}} |
| 1280 (desktop) | {{stitch_url or same stitch_url if edit failed}} | {{stitch_url or n/a}} | {{stitch_url or n/a}} |

Where stitch_url = https://stitch.withgoogle.com/projects/9329790636631148728?node-id={{screen_id}}
and screen_id is the last path segment of the screen's `name` field from list_screens.
Use Stitch web URLs only — never lh3.googleusercontent.com screenshot download URLs.

If any screen did not update, append: ⚠️ {{resolution}} — edit did not persist; screen unchanged.

---
👉 Reviewer: post `/redesign <prompt>` to refine further, or `/promote` when satisfied to start formal review.

4. Move {d_lid} back to 'In Review' with priority 2 (High) using mcp__linear-server__save_issue.

CRITICAL:
- Use model: "GEMINI_3_1_PRO" for all edit_screens calls — never GEMINI_3_PRO.
- Do NOT post checklists — only the Screens delivered table.
- Do NOT self-approve. Move to In Review, not Done.
""".strip()

    spawn_agent("design-agent", redesign_key, task_prompt, state)
    log(f"  🔄 {d_key} /redesign → spawned design-agent [{redesign_key}] for v{next_version}")


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


def _get_github_pr_url(linear_id: str) -> str | None:
    """Return the first GitHub PR URL attached to the given Linear issue, or None."""
    try:
        data = _gql("""
            query($id: String!) {
              issue(id: $id) {
                attachments { nodes { url } }
              }
            }
        """, {"id": linear_id})
        nodes = (data.get("data") or {}).get("issue", {}).get("attachments", {}).get("nodes", [])
        for node in nodes:
            url = node.get("url", "")
            if "github.com" in url and "/pull/" in url:
                return url
        return None
    except Exception as e:
        log(f"  WARN: could not fetch attachments for {linear_id} — {e}")
        return None


def propagate_merged_prs(issues: list[dict], issue_map: dict) -> int:
    """
    For every tracked issue currently 'In Review', check if its linked GitHub
    PR has been merged. If so, move the Linear issue to Done.
    Returns the number of issues propagated.
    """
    reverse_map = {v: k for k, v in issue_map.items()}
    in_review = [i for i in issues if i.get("status") == "In Review" and i["id"] in reverse_map]
    propagated = 0
    for issue in in_review:
        lid = issue["id"]
        key = reverse_map[lid]
        pr_url = _get_github_pr_url(lid)
        if not pr_url:
            continue
        try:
            result = subprocess.run(
                ["gh", "pr", "view", pr_url, "--json", "state,mergedAt"],
                capture_output=True, text=True, timeout=15,
            )
            if result.returncode != 0:
                continue
            pr_data = json.loads(result.stdout)
            if pr_data.get("state") == "MERGED":
                log(f"  🔀 {key} ({lid}): PR merged on GitHub → Done")
                set_status(lid, key, "Done", "PR merged on GitHub")
                propagated += 1
        except Exception as e:
            log(f"  WARN: could not check PR for {lid} — {e}")
    return propagated


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
        "\n\nThis is a REVISION — address every point in the feedback above before moving to In Review."
        if comments else ""
    )
    return f"""
Gate 0 has been cleared for the Cremilo {cfg["sub_app"]} sub-app.
You are working on ONE design issue: {key} ({linear_id}).

Screen: {screen}
{details}{feedback_section}

Design references (read before starting):
- PTS: {cfg["pts_url"]}
- DESIGN: {DESIGN_FILE}

Steps:
1. Read the PRD sections relevant to this screen.
2. Read DESIGN.md for the Mondrian neobrutalist style rules (palette, typography, borders, shadows).
3. Call mcp__stitch__list_screens first. Filter for titles starting with "[{key}]". Parse the
   normalized title format "[{key}] {{ScreenName}} — {{State}} — {{resolution}}px" to identify
   which State+resolution combinations already exist. Only generate missing screens — skip existing ones.
   Use mcp__stitch__generate_screen_from_text for new screens (always pass
   designSystem: "assets/f7ec1a75b48d4b5985962fbe7074ce76") and title format
   "[{key}] {{ScreenName}} — {{State}} — {{resolution}}px" (States: Initial, Error, Filled, Confirm,
   Preview; Resolutions: 390px, 768px, 1280px). For edits to existing screens, use
   mcp__stitch__edit_screens with model: "GEMINI_3_1_PRO".
4. Move {linear_id} to 'In Review' with priority 2 (High) using mcp__linear-server__save_issue.
5. Post a completion comment on {linear_id} using mcp__linear-server__save_comment following
   the In-Review comment template in your skill file (Screens delivered - v1 table only).
   For each screen URL in the table, use the Stitch web URL — NOT the lh3.googleusercontent.com
   screenshot download URL. Construct it from the screen's `name` field (returned by
   list_screens or generate_screen_from_text):
     name format:  "projects/9329790636631148728/screens/{{screen_id}}"
     URL to use:   https://stitch.withgoogle.com/projects/9329790636631148728?node-id={{screen_id}}

IMPORTANT:
- This is your ONLY task — do not work on other design issues.
- Never mark the issue as Done yourself — only 'In Review'.
- Follow the In-Review comment template exactly: screens table only, no rubric, no checklists.
- Run the internal rubric self-check (≤3 iterations) before posting, but do not include the
  self-check table in the comment.{revision_note}
""".strip()


# Design issue catalogue — loaded from gate-watcher-config.json
# Format per entry: [key, linear_id, screen_title, detail]
DESIGN_ISSUES: list[tuple[str, str, str, str]] = [
    tuple(entry) for entry in cfg.get("design_issues", [])
]


def prompt_tl_agent() -> str:
    return f"""
Gate 0 has been cleared for the Cremilo {cfg["sub_app"]} sub-app.
Your job is to complete all infrastructure issues. Query Linear for [I-XX] issues in Todo state, identify which are independent, and execute them in parallel where possible.

Project root: {PROJECT_DIR}
PTS: {cfg["pts_url"]}

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
Gate 0 has been cleared for the Cremilo {cfg["sub_app"]} sub-app.
Your job is to complete Q-01: set up the E2E test framework.

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
PTS: {cfg["pts_url"]}
DESIGN: {DESIGN_FILE}

Dependencies already Done: {deps}

Read AGENTS.md and CLAUDE.md for full stack constraints.

When done:
1. Open a PR with a clear description. In the PR body, add on its own line:
   Closes {linear_id}
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
PTS: {cfg["pts_url"]}
DESIGN: {DESIGN_FILE}

Dependencies already Done: {deps}

Read AGENTS.md and CLAUDE.md for full stack constraints.

When done:
1. Open a PR with a clear description. In the PR body, add on its own line:
   Closes {linear_id}
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

Production URL: {cfg["prod_url"]}
Test credentials: read from .env.local

Write Playwright E2E tests for this feature:
1. Navigate using the production URL above. Use the test credentials for any login/register flows.
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

    # ── Merged PRs → Done ─────────────────────────────────────────────────────
    actions += propagate_merged_prs(issues, m)

    # ── Gate 0 cleared → spawn Design + TL + QA-setup ────────────────────────
    g0_keys = ["G0-1", "G0-2", "G0-3", "G0-4"]
    if all(is_done(k) for k in g0_keys):
        if not state.get("gate0_cleared"):
            log("  ✅ Gate 0 CLEARED")
            state["gate0_cleared"] = True
            actions += 1

        # Spawn ONE design agent at a time — gate blocks if any D-XX is In Progress or In Review
        _design_in_flight = [
            (d_key, st(d_key)) for d_key, _, _, _ in DESIGN_ISSUES
            if st(d_key) in ("In Progress", "In Review")
        ]
        if _design_in_flight:
            for _key, _status in _design_in_flight:
                log(f"  ⏸️  Design queue gated — {_key} is {_status}")
        else:
            for d_key, d_lid, d_screen, d_detail in DESIGN_ISSUES:
                spawn_key = f"gate0-design-{d_key.lower()}"
                if spawn_key not in state.get("spawned", []) and st(d_key) in ("Backlog", "Todo"):
                    spawn_agent("design-agent", spawn_key,
                                prompt_design(d_key, d_lid, d_screen, d_detail), state)
                    actions += 1
                    break  # one at a time — re-check next cycle

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
            # Skip if this In Progress transition was triggered by a /redesign slash command
            slash_cmd, _ = get_latest_slash_command(d_lid)
            if slash_cmd == "redesign":
                log(f"  ⏭️  {d_key} → {curr}: /redesign command in progress — skipping feedback re-queue")
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
    # Loaded from gate-watcher-config.json: {"D-01": ["DEV-01", ["I-04"]], ...}
    design_dev_map = {
        k: (v[0], v[1]) for k, v in cfg.get("design_dev_map", {}).items()
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

    # ── Slash commands for design issues in In Review ─────────────────────────
    # Detects /approve, /promote, /redesign in the latest comment of each D-XX
    # issue that is currently In Review. Each command is idempotent by design:
    # /promote posts a new comment so the latest comment is no longer /promote;
    # /approve moves the issue to Done so the next cycle skips it;
    # /redesign moves the issue to In Progress so the next cycle skips it.
    for d_key, d_lid, d_screen, d_detail in DESIGN_ISSUES:
        if st(d_key) != "In Review":
            continue
        cmd, args = get_latest_slash_command(d_lid)
        if not cmd:
            continue
        if cmd == "approve":
            log(f"  🎯 {d_key}: /approve detected")
            handle_slash_approve(d_key, d_lid, design_dev_map, m, issues, state)
            actions += 1
        elif cmd == "promote":
            log(f"  🎯 {d_key}: /promote detected")
            handle_slash_promote(d_key, d_lid)
            actions += 1
        elif cmd == "redesign":
            log(f"  🎯 {d_key}: /redesign detected")
            handle_slash_redesign(d_key, d_lid, d_screen, d_detail, args, state)
            actions += 1

    # ── DEV In Review → In Progress (/fix workflow) → re-spawn FE agent ─────
    fe_a_issues = {k: tuple(v) for k, v in cfg.get("fe_a_issues", {}).items()}
    fe_b_issues = {k: tuple(v) for k, v in cfg.get("fe_b_issues", {}).items()}

    for key, (lid, desc, deps) in fe_a_issues.items():
        if state.get(key) == "In Review" and st(key) == "In Progress":
            log(f"  🔧 {key}: In Review → In Progress detected — checking for /fix")
            handle_slash_fix(key, lid, desc, deps, "fe-a-agent", state)
            actions += 1

    for key, (lid, desc, deps) in fe_b_issues.items():
        if state.get(key) == "In Review" and st(key) == "In Progress":
            log(f"  🔧 {key}: In Review → In Progress detected — checking for /fix")
            handle_slash_fix(key, lid, desc, deps, "fe-b-agent", state)
            actions += 1

    # ── Multi-dep unlocks → move to Todo ─────────────────────────────────────
    # Loaded from gate-watcher-config.json: [{"deps": ["DEV-04","DEV-05"], "unlocks": ["DEV-07","DEV-08"]}, ...]
    for rule in cfg.get("multi_dep_unlocks", []):
        if all(is_done(d) for d in rule["deps"]):
            for key in rule["unlocks"]:
                if st(key) == "Backlog" and m.get(key):
                    reason = " + ".join(rule["deps"]) + " done"
                    set_status(m[key], key, "Todo", reason)
                    actions += 1

    # ── DEV issues Todo → spawn FE-A or FE-B ─────────────────────────────────
    # Loaded from gate-watcher-config.json: {"DEV-01": ["CRE-31", "description", "deps"], ...}
    for key, (lid, desc, deps) in fe_a_issues.items():
        if is_todo(key):
            spawn_agent("fe-a-agent", f"dev-{key.lower()}", prompt_fe_a(key, lid, desc, deps), state)
            actions += 1

    for key, (lid, desc, deps) in fe_b_issues.items():
        if is_todo(key):
            spawn_agent("fe-b-agent", f"dev-{key.lower()}", prompt_fe_b(key, lid, desc, deps), state)
            actions += 1

    # ── Dev done → trigger QA issues ─────────────────────────────────────────
    # Loaded from config: {"Q-02": [["DEV-01"], "CRE-46", "description"], ...}
    qa_triggers = {k: (v[0], v[1], v[2]) for k, v in cfg.get("qa_triggers", {}).items()}
    for q_key, (deps, lid, desc) in qa_triggers.items():
        if all(is_done(d) for d in deps) and st(q_key) == "Backlog" and m.get(q_key):
            set_status(m[q_key], q_key, "Todo", f"deps done: {deps}")
            actions += 1

    # ── QA issues Todo → spawn QA agent ──────────────────────────────────────
    # Loaded from config: {"Q-02": ["CRE-46", "description", "feature_issues"], ...}
    qa_spawn = {k: tuple(v) for k, v in cfg.get("qa_spawn", {}).items()}
    for q_key, (lid, desc, feat) in qa_spawn.items():
        if is_todo(q_key):
            spawn_agent("qa-agent", f"qa-{q_key.lower()}",
                        prompt_qa_test(q_key, lid, desc, feat), state)
            actions += 1

    # ── All DEV done → trigger full regression ────────────────────────────────
    regression_key = cfg.get("regression_issue", "Q-07")
    all_dev_keys   = cfg.get("all_dev_keys", [])
    staging_key    = cfg.get("staging_issue", "DEV-14")
    regression_lid = cfg.get("regression_lid", "")
    staging_lid    = cfg.get("staging_lid", "")

    if all_dev_keys and all(is_done(k) for k in all_dev_keys) and st(regression_key) == "Backlog" and m.get(regression_key):
        set_status(m[regression_key], regression_key, "Todo", "All DEV issues done")
        actions += 1

    if is_todo(regression_key):
        spawn_agent(
            "qa-agent", f"qa-{regression_key.lower()}",
            prompt_qa_test(
                regression_key, regression_lid,
                "Full regression suite — run all E2E tests against staging URL",
                ", ".join(all_dev_keys)
            ),
            state,
        )
        actions += 1

    # ── Regression done → trigger staging deploy ──────────────────────────────
    if is_done(regression_key) and st(staging_key) == "Backlog" and m.get(staging_key):
        set_status(m[staging_key], staging_key, "Todo", f"{regression_key} full regression passed")
        actions += 1

    if is_todo(staging_key):
        spawn_agent(
            "tl-agent", f"dev-{staging_key.lower()}",
            f"""
{staging_key} ({staging_lid}) has moved to Todo — {regression_key} full regression passed.

Your task: deploy the Cremilo {cfg["sub_app"]} to Vercel staging.

Project root: {PROJECT_DIR}

Steps:
1. Ensure all feature PRs are merged to main.
2. Trigger a Vercel production deploy (or verify it was triggered by the merge).
3. Smoke-test the staging URL manually (load the app, verify login works).
4. Move {staging_lid} to 'Done' in Linear.

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
    if "--all" in sys.argv:
        slugs = sorted(
            f.stem[len("gate-watcher-config-"):]
            for f in _DOCS_DIR.glob("gate-watcher-config-*.json")
        )
        for slug in slugs:
            log(f"══ Sub-app: {slug} ══")
            subprocess.run(
                [sys.executable, str(Path(__file__).resolve()), "--sub-app", slug],
                cwd=str(PROJECT_DIR),
                env=os.environ,
            )
    else:
        run_cycle()
