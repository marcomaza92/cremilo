# Gate Watcher Agent

Use this skill to run the polling loop that detects Linear status transitions and triggers the next agents in the pipeline. This agent is token-cheap by design — it only calls Linear and writes a small log entry per cycle.

## Responsibilities

- Poll Linear every 5 minutes for issues transitioning to `Todo` (approved) or `Done`
- Detect Gate 0 completion (all 4 `[G0]` issues `Done`) → signal Gate 1 can start
- Detect each design approval (D-xx moves to `Todo`) → move corresponding DEV issue to `Todo`
- Detect each dev issue `Done` → move corresponding QA issue to `Todo`
- Detect QA Q-07 `Done` → move `DEV-14` to `Todo`
- Log every transition to `.docs/gate-watcher.log`

## Trigger map

| When | Action |
|---|---|
| All `[G0]` issues → `Done` | Log "Gate 0 cleared. Design + Infra can begin." |
| `D-01` → `Todo` | Move `DEV-01` → `Todo` (if `I-04` Done) |
| `D-02` → `Todo` | Move `DEV-02` → `Todo` (if `I-03` Done) |
| `D-03` → `Todo` | Move `DEV-03` → `Todo` (if `I-05` Done) |
| `D-04` → `Todo` | Move `DEV-04` → `Todo` (if `I-06` Done) |
| `D-05` → `Todo` | Move `DEV-05` → `Todo` (if `I-06` Done) |
| `D-06` → `Todo` | Move `DEV-06` → `Todo` (if `DEV-05` Done) |
| `D-07/08/09` → `Todo` | Move `DEV-10/11/12` → `Todo` (if `I-02` Done) |
| `DEV-01` → `Done` | Move `Q-02` → `Todo` |
| `DEV-04` → `Done` | Move `Q-03` → `Todo` |
| `DEV-05` + `DEV-06` → `Done` | Move `Q-04` → `Todo` |
| `DEV-13` → `Done` | Move `Q-05` → `Todo` |
| `DEV-10/11/12` → `Done` | Move `Q-06` → `Todo` |
| All DEV → `Done` | Move `Q-07` → `Todo` |
| `Q-07` → `Done` | Move `DEV-14` → `Todo` |

## Workflow per cycle

1. List all issues in `Monthly Calculator` project
2. Compare current statuses to previous cycle (stored in `/tmp/gate-watcher-state.json`)
3. Detect transitions → apply trigger map
4. Update Linear issues accordingly
5. Append log entry to `.docs/gate-watcher.log`
6. Sleep 5 minutes → repeat

## Tools allowed

- `mcp__linear-server__list_issues` — read all issues
- `mcp__linear-server__save_issue` — update issue status only
- `Write` / `Read` — `.docs/gate-watcher.log` and `/tmp/gate-watcher-state.json`

## Hard constraints

- Never move an issue to `Done` — only to `Todo` or `In Progress`
- Never create new issues
- Never approve gates — only propagate approvals
- Minimum poll interval: 5 minutes (token budget)
- Log every action taken, even no-ops
