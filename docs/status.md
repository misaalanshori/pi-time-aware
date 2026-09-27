# Implementation Status — pi-time-aware

**Authoritative Spec:** `docs/time-aware-agents-plan.md`  
**Dev Rules:** `docs/dev-rules.md`  
**Gates:** `npm run check:types` (`tsc --noEmit`), `npm test` (`vitest run`), `npm run build` (`tsc -p tsconfig.build.json`)  
**Regressions Location:** `tests/regressions/`  
**Journal:** `docs/journal.md`  
**Report:** `docs/report.md`  

---

## Settled Decisions
1. **Packaging:** First-class Pi extension exposing default extension factory (`pi: ExtensionAPI`) and reusable utility functions.
2. **Cache-Safe Injection:** Time notices appended at the end of messages/results to preserve LLM prefix caching.
3. **Format Standards:** Strict ISO 8601 for absolute timestamps; human-readable unit breakdown for deltas.
4. **Enclosure & Stripping:** Contained in `<TimeAware>...</TimeAware>` tags, with `stripTimeAwareTags()` helper for outbound client sanitization.

---

## Phase Checklist

### Phase T1: Formatter & Sanitizer Utilities
- [x] Time delta formatter: human-readable breakdown (`"2 hours 23 minutes 6 seconds"`, `"just now"`)
- [x] Standard time notice generator (`<TimeAware>Time is ${datetime} (${timeSinceStart} since session started, ${timeSinceLastMessage} since previous message)</TimeAware>`)
- [x] Tool duration notice generator (`<TimeAware>Tool took ${duration} to run, finished at ${datetime}</TimeAware>`)
- [x] Transport sanitizer: `stripTimeAwareTags(text)`
- [x] Phase T1 test suite passing

### Phase T2: Pi Extension Implementation
- [x] `session_start` hook: session start timestamp initialization
- [x] `input` hook: deltas calculation, appending time notice to user prompt
- [x] `tool_call` & `tool_result` hooks: measuring execution duration and appending duration notice to tool result
- [x] `message_end` hook: appending time notice to assistant messages
- [x] Phase T2 test suite passing

### Phase T3: Integration & Transcript Verification
- [x] End-to-end integration test with Pi AgentSession (mock or in-memory)
- [x] Verifying `<TimeAware>` appears in transcripts across user turns, tool results, and assistant turns
- [x] Verifying `stripTimeAwareTags` leaves user-facing replies clean
- [x] Phase T3 test suite passing

### Phase T4: Hardening & Regressions
- [x] Edge cases: negative delta clamping (clock skew), non-text tool results, multiple tool calls, empty inputs
- [x] Regression test suite in `tests/regressions/`
- [x] All gates green (`check:types`, `test`, `build`)
- [x] Cycle report written (`docs/report.md`)
