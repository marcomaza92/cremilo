#!/usr/bin/env python3
"""
Session-start summary for Cremilo.
Prints a one-page "you are here" — phase, next action, blockers,
live Linear state, gate status, and recent gate-watcher activity.

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
MAP_FILE     = Path(__file__).parent / "gate-watcher-map.json"

# Linear doc IDs — single source of truth
ROADMAP_DOC_ID = "072e5656-b40f-4ac9-a49a-aebd99b22db1"
LOG_FILE     = Path(__file__).parent / "gate-watcher.log"
PENDING_FILE = Path(__file__).parent / "pending-agents.json"

LINEAR_URL   = "https://api.linear.app/graphql"
_PROJECT_ID  = "e4bb212a-8e3f-4f64-bdd0-18c4b256b8ed"

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


# ── ROADMAP frontmatter ────────────────────────────────────────────────────────

def parse_frontmatter(source) -> dict:
    """Extract YAML frontmatter from the first --- block.
    Accepts a Path (local file) or a string (e.g. fetched Linear doc content).
    Handles: simple key: value, block scalars (key: |), sequences (key:\n  - item),
    and frontmatter wrapped in a ```yaml ... ``` code block.
    """
    if isinstance(source, Path):
        text = source.read_text() if source.exists() else ""
    else:
        text = source or ""
    # Handle code-block-wrapped frontmatter (Linear wraps --- blocks in ```yaml)
    cb = re.match(r"^```(?:yaml)?\n(---\n.*?\n---)\n```", text, re.DOTALL)
    if cb:
        text = cb.group(1) + text[cb.end():]
    m = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not m:
        return {}
    result: dict = {}
    current_key: str | None = None
    mode: str | None = None   # "scalar" | "list"
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


# ── Linear state ──────────────────────────────────────────────────────────────

def fetch_issues() -> list[dict]:
    data = _gql("""
        query($projectId: String!) {
          project(id: $projectId) {
            issues(first: 100) {
              nodes { identifier title state { name } }
            }
          }
        }
    """, {"projectId": _PROJECT_ID})
    nodes = (data.get("data") or {}).get("project", {}).get("issues", {}).get("nodes", [])
    return [{"id": n["identifier"], "title": n["title"], "status": n["state"]["name"]} for n in nodes]


def status_of(key: str, issue_map: dict, issues: list[dict]) -> str | None:
    lid = issue_map.get(key)
    if not lid:
        return None
    for i in issues:
        if i["id"] == lid:
            return i["status"]
    return None


# ── Gate-watcher log ──────────────────────────────────────────────────────────

def last_cycles(n: int = 3) -> list[str]:
    """Return the last n cycle summaries from the gate-watcher log."""
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


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    roadmap_text = fetch_document_content(ROADMAP_DOC_ID)
    fm = parse_frontmatter(roadmap_text)
    issue_map = json.loads(MAP_FILE.read_text()) if MAP_FILE.exists() else {}

    print()
    print(rule("━"))
    phase = fm.get("active_phase", "?")
    label = fm.get("active_phase_label", "")
    today = datetime.now().strftime("%Y-%m-%d")
    print(f"  CREMILO — {today}   (Phase {phase}: {label})")
    print(rule("━"))

    substage   = fm.get("active_substage", "—")
    last_date  = fm.get("last_session_date", "—")
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

    # ── Linear state ─────────────────────────────────────────────────────────
    print(header("LINEAR STATE"))
    issues = fetch_issues()
    if not issues:
        print("  (could not fetch — check LINEAR_API_KEY)")
    else:
        by_status: dict[str, list[str]] = {}
        for i in issues:
            by_status.setdefault(i["status"], []).append(i["id"])

        order = ["In Progress", "In Review", "Todo", "Done", "Backlog", "Cancelled"]
        icons = {"In Progress": "🔵", "In Review": "🟣", "Todo": "⬜", "Done": "✅", "Backlog": "◻", "Cancelled": "✖"}
        for s in order:
            ids = by_status.get(s, [])
            if not ids:
                continue
            icon = icons.get(s, "·")
            if s == "Done":
                print(f"  {icon} {s:<14} {len(ids)}")
            else:
                print(f"  {icon} {s:<14} {len(ids)}  — {', '.join(ids)}")

        # Active issues (non-Done, non-Backlog, non-Cancelled, tracked in map)
        tracked = set(issue_map.values())
        active = [i for i in issues if i["status"] not in ("Done", "Backlog", "Cancelled") and i["id"] in tracked]
        if active:
            print()
            print("  Active tracked issues:")
            for i in active:
                key = next((k for k, v in issue_map.items() if v == i["id"]), i["id"])
                print(f"    [{i['status']:<12}]  {key} — {i['title'][:40]}")

    # ── Gate status ───────────────────────────────────────────────────────────
    print(header("GATE STATUS"))
    if issues:
        g0_keys = ["G0-1", "G0-2", "G0-3", "G0-4"]
        g0_done = all(status_of(k, issue_map, issues) == "Done" for k in g0_keys)
        print(f"  Gate 0  {'✅ cleared' if g0_done else '🔴 not cleared'}")

        d_keys = [f"D-{i:02d}" for i in range(1, 10)]
        d_done = sum(1 for k in d_keys if status_of(k, issue_map, issues) == "Done")
        print(f"  Gate 1  {d_done}/{len(d_keys)} designs done")

        q7 = status_of("Q-07", issue_map, issues)
        q7_label = "✅ passed" if q7 == "Done" else f"pending (Q-07 is {q7 or 'Backlog'})"
        print(f"  Gate 2  {q7_label}")
    else:
        print("  (offline — run gate-watcher to refresh)")

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
    print(rule("━"))
    print()


if __name__ == "__main__":
    main()
