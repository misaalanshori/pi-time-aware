# Development Journal — pi-time-aware

## 2026-09-27 — Cycle Start & Phase T1 Complete
- Initialized repository: Node 24 ESM, TypeScript, Vitest, `@earendil-works/pi-coding-agent`.
- Configured project rules and phases according to `docs/dev-rules.md` and `docs/time-aware-agents-plan.md`.
- Implemented Phase T1:
  - `src/formatter.ts`:
    - `formatTimeDelta`: human-readable time breakdown with correct pluralization and `<1s` clamping.
    - `formatDuration`: tool execution duration with sub-10s millisecond accuracy.
    - `formatStandardTimeNotice`: ISO 8601 absolute timestamp with session elapsed and previous message elapsed deltas inside `<TimeAware>` tag.
    - `formatToolDurationNotice`: Tool execution duration notice inside `<TimeAware>` tag.
    - `stripTimeAwareTags`: transport sanitizer stripping `<TimeAware>` tags for client presentation.
  - Tests verified: 14 passing unit tests covering all edge cases.
  - Gates green: `check:types`, `test`, `build`.

## 2026-09-27 — Phase T2 Complete
- Implemented Phase T2:
  - `src/extension.ts`:
    - `session_start`: records initial session start timestamp.
    - `input`: computes session and message elapsed deltas, appends `<TimeAware>` standard notice to user inputs.
    - `tool_call` & `tool_result`: measures high-resolution execution duration, appends `<TimeAware>Tool took ...</TimeAware>` to tool result content blocks.
    - `message_end`: appends standard time notice to assistant messages in transcript.
  - `src/index.ts`: module entrypoint exporting formatters, sanitizers, and extension factories.
  - Tests verified: 18 passing tests covering all extension event hooks.
  - Gates green: `check:types`, `test`, `build`.

## 2026-09-27 — Phase T3 Complete
- Implemented Phase T3:
  - `tests/time-aware-integration.test.ts`: End-to-end integration test verifying complete multi-turn lifecycle.
  - Verified user prompts, tool results, and assistant messages receive `<TimeAware>` tags in transcript context.
  - Verified `stripTimeAwareTags` strips tags for client display.
  - Tests verified: 19 passing tests.
  - Gates green: `check:types`, `test`, `build`.

## 2026-09-27 — Phase T4 & Cycle Complete
- Implemented Phase T4:
  - Permanent regression test suite in `tests/regressions/`:
    - `clock-skew-negative-deltas.regression.test.ts`: Clamping negative intervals to `"just now"` on backward clock adjustments.
    - `non-text-tool-result.regression.test.ts`: Appending duration notices safely when tools return empty or non-text (image-only) content blocks.
    - `concurrent-tool-calls.regression.test.ts`: Independent duration tracking for concurrent parallel tool calls via `toolCallId`.
  - All gates green: `check:types`, `test` (24 tests passing), `build`.
  - Completed close-out report in `docs/report.md`.

## 2026-09-27 — Sanity Check, Session Recovery & Packaging Hardening
- Performed thorough architectural audit of `pi-time-aware`:
  - Session recovery: Extracted original `sessionStartTime` from `ctx.sessionManager.getHeader().timestamp` and `lastMessageTime` from transcript entries on resume, accurately reflecting multi-day gaps rather than resetting to process launch.
  - Lifecycle cleanup: Added `session_shutdown` and `session_before_switch` listeners to clear active tool timer maps and prevent cross-session leaks.
  - Timezone resilience: Added invalid timezone error handling falling back to UTC ISO format without crashing.
  - Packaging: Added `"exports"` and `"files"` fields in `package.json` for standard ESM import resolution.
  - Pi Extension Loader Default Export: Exported `default` from `src/index.ts` so `pi --extension pi-time-aware` loads the factory function properly instead of undefined.
  - Lifecycle hardening: Added `agent_end` listener to purge abandoned tool timers after each turn.
  - Defensive math: Added NaN/invalid-date protections in `toDate`, `formatTimeDelta`, `formatDuration`, and standard ISO hour cycle `h23`.
  - All gates green: `check:types`, `test` (31 tests passing), `build`.
