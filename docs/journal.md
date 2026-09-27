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
