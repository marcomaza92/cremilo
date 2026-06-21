#!/usr/bin/env python3
"""
Session-start summary for Cremilo.
Prints a one-page "you are here" — phase, next action, blockers,
live Linear state per sub-app, gate status per sub-app, and recent
gate-watcher activity.

Usage:
    python3 ~/www/personal/cremilo/.docs/session-start.py
"""

from __future__ import annotations

import json
import os
import re
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

PROJECT_DIR  = Path(__file__).parent.parent
_DOCS_DIR    = Path(__file__).parent

# Linear doc IDs — single source of truth
ROADMAP_DOC_ID = "072e5656-b40f-4ac9-a49a-aebd99b22db1"
LOG_FILE     = _DOCS_DIR / "gate-watcher.log"
PENDING_FILE = _DOCS_DIR / "pending-agents.json"

LINEAR_URL   = "https://api.linear.app/graphql"

WIDTH = 65


# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_linear_key() -> str:
    key = os.environ.get("LINEAR_API_KEY", "")
    if not key:
        env_file = PROJECT_DIR / ".env.local"
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                if line.startswith("LINEAR_API_KEY="):
                    key = line.split("=", 1)[1].strip()
                    break
    return key


def _gql(query: str, variables: dict | None = None) -> dict:
    key = _load_linear_key()
    if not key:
        return {}
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        LINEAR_URL, data=payload,
        headers={"Authorization": key, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except Exception:
        return {}


def fetch_document_content(doc_id: str) -> str:
    data = _gql("""
        query($id: String!) {
          document(id: $id) { content }
        }
    """, {"id": doc_id})
    return ((data.get("data") or {}).get("document") or {}).get("content", "")


def rule(char="─") -> str:
    return char * WIDTH


def header(title: str) -> str:
    return f"\n{title}\n" + "─" * len(title)


# ── Sub-app discovery ─────────────────────────────────────────────────────────

def _discover_sub_apps() -> list[tuple[str, dict, dict]]:
    """
    Return [(slug, cfg, issue_map), ...] for every gate-watcher-config-{slug}.json
    that has a matching gate-watcher-map-{slug}.json.
    """
    result = []
    for f in sorted(_DOCS_DIR.glob("gate-watcher-config-*.json")):
        slug = f.stem[len("gate-watcher-config-"):]
        map_file = _DOCS_DIR / f"gate-watcher-map-{slug}.json"
        if not map_file.exists():
            continue
        try:
            cfg       = json.loads(f.read_text())
            issue_map = json.loads(map_file.read_text())
            result.append((slug, cfg, issue_map))
        except Exception:
            continue
    return result


# ── Linear state ──────────────────────────────────────────────────────────────

def _fetch_project_issues(project_id: str) -> list[dict]:
    data = _gql("""
        query($projectId: String!) {
          project(id: $projectId) {
            issues(first: 100) {
              nodes { identifier title state { name } }
            }
          }
        }
    """, {"projectId": project_id})
    nodes = (data.get("data") or {}).get("project", {}).get("issues", {}).get("nodes", [])
    return [{"id": n["identifier"], "title": n["title"], "status": n["state"]["name"]} for n in nodes]


def fetch_issues_for(cfg: dict) -> list[dict]:
    """Fetch all issues across a sub-app's project_id + extra_project_ids."""
    seen: set[str] = set()
    result: list[dict] = []
    pids = [cfg["project_id"]] + cfg.get("extra_project_ids", [])
    for pid in pids:
        for issue in _fetch_project_issues(pid):
            if issue["id"] not in seen:
                seen.add(issue["id"])
                result.append(issue)
    return result


def status_of(key: str, issue_map: dict, issues: list[dict]) -> str | None:
    lid = issue_map.get(key)
    if not lid:
        return None
    for i in issues:
        if i["id"] == lid:
            return i["status"]
    return None


# ── ROADMAP frontmatter ────────────────────────────────────────────────────────

def parse_frontmatter(source) -> dict:
    if isinstance(source, Path):
        text = source.read_text() if source.exists() else ""
    else:
        text = source or ""
    cb = re.match(r"^```(?:yaml)?\n(---\n.*?\n---)\n```", text, re.DOTALL)
    if cb:
        text = cb.group(1) + text[cb.end():]
    else:
        # Raw YAML code block without --- delimiters (Linear's native format)
        cb2 = re.match(r"^```(?:yaml)?\n(.*?)\n```", text, re.DOTALL)
        if cb2:
            text = "---\n" + cb2.group(1) + "\n---" + text[cb2.end():]
    m = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not m:
        return {}
    result: dict = {}
    current_key: str | None = None
    mode: str | None = None
    buf: list[str] = []

    def flush():
        nonlocal current_key, mode, buf
        if current_key is None:
            return
        if mode == "scalar":
            result[current_key] = "\n".join(buf).strip()
        elif mode == "list":
            result[current_key] = buf[:]
        current_key = None
        mode = None
        buf = []

    for line in m.group(1).splitlines():
        if line.startswith("#"):
            continue
        if line.startswith("  ") and current_key:
            stripped = line.strip()
            if mode == "list" and stripped.startswith("- "):
                buf.append(stripped[2:].strip().strip('"\''))
            elif mode == "scalar":
                buf.append(stripped)
            continue
        flush()
        kv = re.match(r'^([\w][\w_-]*):\s*(.*?)\s*$', line)
        if not kv:
            continue
        key, val = kv.group(1), kv.group(2).strip().strip('"\'')
        if val == "|":
            current_key, mode, buf = key, "scalar", []
        elif val == "":
            current_key, mode, buf = key, "list", []
        else:
            result[key] = val
    flush()
    return result


# ── Gate-watcher log ──────────────────────────────────────────────────────────

def last_cycles(n: int = 3) -> list[str]:
    if not LOG_FILE.exists():
        return []
    lines = LOG_FILE.read_text().splitlines()
    cycles: list[list[str]] = []
    current: list[str] = []
    for line in lines:
        if "── Cycle start" in line:
            current = [line]
        elif "── Cycle end" in line and current:
            current.append(line)
            cycles.append(current)
            current = []
        elif current:
            current.append(line)
    summaries = []
    for cycle in cycles[-n:]:
        ts = re.search(r"\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2})", cycle[0])
        end = next((l for l in cycle if "Cycle end" in l), "")
        actions_match = re.search(r"(\d+) action", end)
        actions = int(actions_match.group(1)) if actions_match else 0
        notable = [
            re.sub(r"^\[.*?\]\s+", "", l)
            for l in cycle[1:-1]
            if any(x in l for x in ("📋", "🔀", "→ ", "✅", "⚠️"))
        ]
        ts_str = ts.group(1) if ts else "?"
        if notable:
            summaries.append(f"  [{ts_str}]  {actions} action(s): " + " · ".join(notable[:3]))
        else:
            summaries.append(f"  [{ts_str}]  {actions} action(s)")
    return summaries


# ── Pending agents ────────────────────────────────────────────────────────────

def pending_agents() -> list[dict]:
    if not PENDING_FILE.exists():
        return []
    try:
        data = json.loads(PENDING_FILE.read_text())
        return [e for e in data if e.get("status") != "done"]
    except Exception:
        return []


# ── Per-sub-app display ───────────────────────────────────────────────────────

def print_sub_app_block(slug: str, cfg: dict, issue_map: dict, issues: list[dict]):
    label = cfg.get("sub_app", slug)
    print(f"\n{'─' * WIDTH}")
    print(f"  SUB-APP: {label}")
    print(f"{'─' * WIDTH}")

    # Linear state counts
    by_status: dict[str, list[str]] = {}
    tracked = set(issue_map.values())
    for i in issues:
        by_status.setdefault(i["status"], []).append(i["id"])

    order  = ["In Progress", "In Review", "Todo", "Done", "Backlog", "Cancelled"]
    icons  = {"In Progress": "🔵", "In Review": "🟣", "Todo": "⬜", "Done": "✅", "Backlog": "◻", "Cancelled": "✖"}
    for s in order:
        ids = by_status.get(s, [])
        if not ids:
            continue
        icon = icons.get(s, "·")
        if s == "Done":
            print(f"  {icon} {s:<14} {len(ids)}")
        else:
            print(f"  {icon} {s:<14} {len(ids)}  — {', '.join(ids)}")

    active = [i for i in issues if i["status"] not in ("Done", "Backlog", "Cancelled") and i["id"] in tracked]
    if active:
        print()
        print("  Active tracked issues:")
        for i in active:
            key = next((k for k, v in issue_map.items() if v == i["id"]), i["id"])
            print(f"    [{i['status']:<12}]  {key} — {i['title'][:40]}")

    # Gate status
    print(f"\n  Gate status:")
    g0_keys = ["G0-1", "G0-2", "G0-3", "G0-4"]
    g0_done = all(status_of(k, issue_map, issues) == "Done" for k in g0_keys)
    print(f"    Gate 0  {'✅ cleared' if g0_done else '🔴 not cleared'}")

    d_keys = [entry[0] for entry in cfg.get("design_issues", [])]
    d_total = len(d_keys)
    d_done  = sum(1 for k in d_keys if status_of(k, issue_map, issues) == "Done")
    print(f"    Gate 1  {d_done}/{d_total} designs done")

    reg_key = cfg.get("regression_issue", "")
    reg_status = status_of(reg_key, issue_map, issues) if reg_key else None
    if reg_status == "Done":
        reg_label = "✅ passed"
    elif reg_status:
        reg_label = f"pending ({reg_key} is {reg_status})"
    else:
        reg_label = "pending"
    print(f"    Gate 2  {reg_label}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    roadmap_text = fetch_document_content(ROADMAP_DOC_ID)
    fm = parse_frontmatter(roadmap_text)
    sub_apps = _discover_sub_apps()

    print()
    print(rule("━"))
    phase = fm.get("active_phase", "?")
    label = fm.get("active_phase_label", "")
    today = datetime.now().strftime("%Y-%m-%d")
    print(f"  CREMILO — {today}   (Phase {phase}: {label})")
    print(rule("━"))

    substage  = fm.get("active_substage", "—")
    last_date = fm.get("last_session_date", "—")
    print(f"\nSubstage     : {substage}")
    print(f"Last session : {last_date}")

    next_action = fm.get("next_action", "")
    if next_action:
        print(header("NEXT ACTION"))
        for line in next_action.strip().splitlines():
            print(f"  {line}")

    blockers_raw = fm.get("blockers", "")
    if blockers_raw:
        print(header("BLOCKERS"))
        if isinstance(blockers_raw, list):
            for b in blockers_raw:
                print(f"  ⚠  {b}")
        elif isinstance(blockers_raw, str):
            for b in blockers_raw.strip().splitlines():
                b = b.lstrip("- \"'").rstrip("\"'")
                if b:
                    print(f"  ⚠  {b}")

    # ── Per-sub-app blocks ────────────────────────────────────────────────────
    if not sub_apps:
        print("\n  (no gate-watcher-config-{slug}.json files found)")
    else:
        print(header("LINEAR STATE + GATES"))
        for slug, cfg, issue_map in sub_apps:
            issues = fetch_issues_for(cfg)
            if not issues:
                print(f"\n  {cfg.get('sub_app', slug)}: (could not fetch — check LINEAR_API_KEY)")
                continue
            print_sub_app_block(slug, cfg, issue_map, issues)

    # ── Pending agents ────────────────────────────────────────────────────────
    pending = pending_agents()
    print(header("PENDING AGENTS"))
    if not pending:
        print("  0 queued")
    else:
        print(f"  {len(pending)} queued:")
        for e in pending:
            print(f"    [{e.get('status','?'):<8}]  {e.get('task_id','?')}  ({e.get('type','?')})")

    # ── Gate-watcher log ──────────────────────────────────────────────────────
    cycles = last_cycles(3)
    print(header("GATE-WATCHER (last 3 cycles)"))
    if cycles:
        for c in cycles:
            print(c)
    else:
        print("  (no log found)")

    print()
    print(rule("━"))
    gw = PROJECT_DIR / ".docs" / "gate-watcher.py"
    print(f"  Gate watcher : python3 {gw.relative_to(Path.home())}")
    print(f"  All sub-apps : python3 {gw.relative_to(Path.home())} --all")
    print(rule("━"))
    print()


if __name__ == "__main__":
    main()
