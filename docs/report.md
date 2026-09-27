# pi-time-aware — Development Cycle Report

**Date:** 2026-09-27  
**Status:** Completed  
**All Gates:** Green (`tsc --noEmit`, `vitest run` 24/24 tests passing, `tsc -p tsconfig.build.json`)

---

## 1. What Was Done Per Phase and What Was Driven for Real

### Phase T1: Formatter & Sanitizer Utilities
- Implemented `src/formatter.ts`:
  - `formatTimeDelta`: Formats milliseconds into clean human-readable text (`"2 hours 23 minutes 6 seconds"`), with `<1s` clamped to `"just now"`.
  - `formatDuration`: Formats tool call durations with millisecond resolution when `<10s`.
  - `formatStandardTimeNotice`: Generates `<TimeAware>Time is ${datetime} (${timeSinceStart} since session started, ${timeSinceLastMessage} since previous message)</TimeAware>`.
  - `formatToolDurationNotice`: Generates `<TimeAware>Tool took ${duration} to run, finished at ${datetime}</TimeAware>`.
  - `stripTimeAwareTags`: Strips `<TimeAware>...</TimeAware>` tags (single and multiline) for clean client display.
- Tested: 14 passing unit tests covering all delta combinations, pluralizations, and edge cases.

### Phase T2: Pi Extension Implementation
- Implemented `src/extension.ts` & `src/index.ts`:
  - Hooks into Pi's `ExtensionAPI`:
    - `session_start`: Captures session start timestamp.
    - `input`: Intercepts user prompt, appends standard time notice to the end (cache-safe), and updates last message time.
    - `tool_call` & `tool_result`: Tracks execution duration per `toolCallId` and appends duration notice to the tool result text block.
    - `message_end`: Appends standard time notice to assistant messages in transcript.
- Tested: Unit tests verifying handler registration and transcript mutations across inputs, tools, and assistant messages.

### Phase T3: Integration & Transcript Verification
- Implemented `tests/time-aware-integration.test.ts`:
  - Verified a full multi-step conversation turn (prompt -> tool call -> tool result -> assistant response) in an integrated extension environment.
  - Verified that model context contains `<TimeAware>` tags on every element, while `stripTimeAwareTags` strips tags completely for the user.

### Phase T4: Hardening & Regressions
- Implemented permanent regression tests in `tests/regressions/`:
  - Negative delta clamping on clock jumps / NTP adjustments.
  - Safe appending when tools return non-text (image-only) or empty content blocks.
  - Independent duration tracking for concurrent parallel tool calls.

---

## 2. What Now Works End to End
- Any Pi agent loading `pi-time-aware` receives time grounding:
  - User messages inform the agent of the exact current UTC time and elapsed time since session start and previous turn.
  - Tool outputs inform the agent of execution duration and completion timestamp.
  - Outbound user text is cleanly sanitized with `stripTimeAwareTags()`.
  - Suffix injection preserves prompt cache prefixes.

---

## 3. Acceptance Checklist
- [x] Every phase's exit condition met with named evidence.
- [x] Every defect/edge case found has its regression test; suite grew (24 tests passing).
- [x] All gates green (`check:types`, `vitest run`, `build`).
- [x] Report written; status doc synced; tree clean; commits recorded.
