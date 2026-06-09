#!/usr/bin/env bash
# Orchestrator hook — runs when user says "summon the team for review"
# Executes gate-watcher and outputs pending agent data for Claude to act on.

set -euo pipefail

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.user_prompt // empty')

# Only activate on summon phrase
echo "$PROMPT" | grep -qiE 'summon the team' || exit 0

PROJECT="${PWD}"

echo "=== 🚀 ORCHESTRATOR PRE-RUN ==="
echo ""

# Step 1 — Run gate-watcher
echo "--- Gate Watcher ---"
cd "$PROJECT" && python3 .docs/gate-watcher.py 2>&1
echo ""

# Step 2 & 3 — Pending types + staggered fire times
echo "--- Agent Fire Schedule ---"
python3 - <<'PYEOF'
import json
from datetime import datetime, timedelta, timezone

import os
QUEUE = os.path.join(os.environ.get('PWD', ''), '.docs/pending-agents.json')
queue = json.loads(open(QUEUE).read())
types = sorted(set(x['type'] for x in queue if x.get('status') == 'pending'))

now = datetime.now(timezone.utc)
gw_time = now + timedelta(minutes=60)

MAPPING = {
    'design-agent': 'cremilo-design-agent',
    'tl-agent':     'cremilo-tl-agent',
    'fe-a-agent':   'cremilo-fe-a-agent',
    'fe-b-agent':   'cremilo-fe-b-agent',
    'qa-agent':     'cremilo-qa-agent',
}
ORDER = list(MAPPING.keys())

if not types:
    print("pending_types=none")
else:
    print(f"pending_types={','.join(types)}")
    for i, agent_type in enumerate(ORDER):
        if agent_type in types:
            t = now + timedelta(minutes=2 + i * 2)
            task_id = MAPPING[agent_type]
            print(f"fire:{task_id}={t.strftime('%Y-%m-%dT%H:%M:%S+00:00')}")

print(f"fire:gate-watcher={gw_time.strftime('%Y-%m-%dT%H:%M:%S+00:00')}")
PYEOF

echo ""
echo "=== END ORCHESTRATOR PRE-RUN ==="
echo ""
echo "Claude: read the fire: lines above and call mcp__scheduled-tasks__update_scheduled_task"
echo "for each task_id → fireAt pair. Always include gate-watcher. Skip agents not listed."

exit 0
