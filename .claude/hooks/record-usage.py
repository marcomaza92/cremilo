#!/usr/bin/env python3
"""
Stop hook: records each Claude turn into USAGE.md with token counts,
cost estimate, elapsed time, tools used, and an enhancement tip.
"""

import json
import re
import sys
import os
import subprocess
from pathlib import Path
from datetime import datetime

_SECRET_PATTERNS = [
    r'lin_api_[A-Za-z0-9_\-]+',
    r'sk-ant-[A-Za-z0-9_\-]+',
    r'sbp_[A-Za-z0-9]+',
    r'ghp_[A-Za-z0-9]+',
    r'github_pat_[A-Za-z0-9_]+',
    r'AKIA[0-9A-Z]{16}',
    r'eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+',
]

def _redact(text: str) -> str:
    for pattern in _SECRET_PATTERNS:
        text = re.sub(pattern, '[REDACTED]', text)
    return text


PRICING = {
    "claude-sonnet-4-6":        {"input": 3.0,  "output": 15.0, "cache_read": 0.30, "cache_write": 3.75},
    "claude-opus-4-5":          {"input": 15.0, "output": 75.0, "cache_read": 1.50, "cache_write": 18.75},
    "claude-opus-4-7":          {"input": 15.0, "output": 75.0, "cache_read": 1.50, "cache_write": 18.75},
    "claude-haiku-4-5":         {"input": 0.80, "output": 4.0,  "cache_read": 0.08, "cache_write": 1.0},
}
DEFAULT_RATES = {"input": 3.0, "output": 15.0, "cache_read": 0.30, "cache_write": 3.75}


def get_rates(model: str) -> dict:
    for key, rates in PRICING.items():
        if model.startswith(key) or key in model:
            return rates
    return DEFAULT_RATES


def parse_last_turn(transcript: Path):
    """Returns (last_assistant_entry, last_user_prompt, tools_used_set)."""
    entries = []
    with open(transcript) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except Exception:
                pass

    last_assistant = None
    last_user_prompt = None
    tools_used = set()

    for e in reversed(entries):
        etype = e.get("type")

        if etype == "assistant":
            msg = e.get("message", {})
            if msg.get("usage") and last_assistant is None:
                last_assistant = e
            # Collect tool names from any assistant in this turn
            if last_assistant is not None:
                for block in msg.get("content", []):
                    if isinstance(block, dict) and block.get("type") == "tool_use":
                        tools_used.add(block.get("name", ""))

        elif etype == "user":
            if e.get("toolUseResult"):
                # Tool result — still part of current turn, keep going
                continue
            # Real user message — extract text and stop
            msg = e.get("message", {})
            content = msg.get("content", "")
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "text":
                        last_user_prompt = block.get("text", "")
                        break
            elif isinstance(content, str):
                last_user_prompt = content
            if last_assistant is not None:
                break  # Found boundary of the last turn

    return last_assistant, last_user_prompt, tools_used


def get_elapsed(session_id: str) -> str:
    start_file = f"/tmp/claude-usage-start-{session_id}"
    if not os.path.exists(start_file):
        return "N/A"
    try:
        start_ms = int(open(start_file).read().strip())
        now_ms = int(datetime.now().timestamp() * 1000)
        elapsed_s = (now_ms - start_ms) / 1000
        os.remove(start_file)
        return f"{elapsed_s:.1f}s"
    except Exception:
        return "N/A"


def get_enhancement(prompt: str) -> str:
    if not prompt:
        return ""
    try:
        env = {**os.environ, "CLAUDE_USAGE_SKIP": "1"}
        result = subprocess.run(
            [
                "claude", "-p",
                (
                    f'Given this user prompt to an AI assistant: "{prompt[:300]}"'
                    " — respond with exactly 2 lines:"
                    ' Line 1: "Summary: [5-8 word description of what was asked]"'
                    ' Line 2: "Tip: [one concrete way to phrase this better for an AI]"'
                    " No other text."
                ),
            ],
            capture_output=True,
            text=True,
            timeout=25,
            env=env,
        )
        return result.stdout.strip()
    except Exception:
        return ""


def main():
    try:
        hook_input = json.loads(sys.stdin.read())
    except Exception:
        hook_input = {}

    # Skip if called from a claude -p sub-process (sentinel env var)
    if os.environ.get("CLAUDE_USAGE_SKIP") == "1":
        return

    session_id = hook_input.get("session_id", "")
    if not session_id:
        return

    cwd = os.getcwd()
    encoded = cwd.replace("/", "-")
    transcript = Path.home() / ".claude" / "projects" / encoded / f"{session_id}.jsonl"

    if not transcript.exists():
        return

    last_assistant, last_user_prompt, tools_used = parse_last_turn(transcript)
    if not last_assistant:
        return

    msg = last_assistant.get("message", {})
    model = msg.get("model", "unknown")
    usage = msg.get("usage", {})

    input_tokens  = usage.get("input_tokens", 0)
    output_tokens = usage.get("output_tokens", 0)
    cache_read    = usage.get("cache_read_input_tokens", 0)
    cache_write   = usage.get("cache_creation_input_tokens", 0)
    total_tokens  = input_tokens + output_tokens + cache_read + cache_write

    rates = get_rates(model)
    cost = (
        input_tokens  * rates["input"]       / 1_000_000
        + output_tokens * rates["output"]      / 1_000_000
        + cache_read    * rates["cache_read"]  / 1_000_000
        + cache_write   * rates["cache_write"] / 1_000_000
    )

    elapsed_str  = get_elapsed(session_id)
    tools_str    = ", ".join(sorted(tools_used)) if tools_used else "none"
    timestamp    = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    prompt_short = _redact((last_user_prompt or "")[:100].replace("\n", " "))
    if len(last_user_prompt or "") > 100:
        prompt_short += "…"

    enhancement = get_enhancement(_redact(last_user_prompt or ""))

    entry = f"""## {timestamp}

| Field | Value |
|---|---|
| Model | `{model}` |
| Input tokens | {input_tokens:,} |
| Output tokens | {output_tokens:,} |
| Cache read | {cache_read:,} |
| Cache write | {cache_write:,} |
| Total tokens | {total_tokens:,} |
| Estimated cost | ${cost:.5f} |
| Processing time | {elapsed_str} |
| Tools used | {tools_str} |

**Prompt:** {prompt_short}

{enhancement}

---
"""

    # USAGE.md lives outside the repo — it's an operational doc, not code.
    usage_file = Path.home() / "www" / "personal" / "docs" / "cremilo" / "USAGE.md"
    usage_file.parent.mkdir(parents=True, exist_ok=True)
    if not usage_file.exists():
        usage_file.write_text("# Usage Log\n\nAuto-generated record of Claude interactions.\n\n---\n\n")

    with open(usage_file, "a") as f:
        f.write(entry)


if __name__ == "__main__":
    main()
