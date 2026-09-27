# pi-time-aware

> Time-aware agent extension for [Pi](https://github.com/earendil-works/pi) (`@earendil-works/pi-coding-agent`). Injects wall-clock timestamps, elapsed conversation intervals, and tool execution durations into the model context while preserving prompt prefix caching.

---

## Why

Large Language Models do not possess an internal real-time clock. In interactive or persistent agent workflows:
1. **Time blindness:** The model cannot infer whether a user replied in 5 seconds, 5 hours, or 5 days.
2. **Execution blindness:** The model cannot tell if a tool call finished in 20 milliseconds or hung for 45 seconds.
3. **Session amnesia on resume:** Resuming a multi-day session makes old conversations feel like they happened "just now".

`pi-time-aware` solves this by injecting structured, machine-parseable `<TimeAware>` tags into **user inputs**, **tool results**, and **assistant transcript messages**, giving the model true temporal grounding.

---

## Features

- **Cache-Safe Suffix Injection:** Dynamic timestamps are placed at the **tail** of inputs and tool results rather than the head, keeping preceding prompt prefixes identical to maximize LLM prompt cache hits.
- **Transcript History Recovery:** On session startup or resume, recovers the original session creation timestamp and previous entry times from Pi's `SessionManager` transcript history.
- **Accurate Tool Durations:** Automatically clocks `tool_call` to `tool_result` round-trips with millisecond/second formatting.
- **Timezone Aware:** Outputs ISO 8601 strings with explicit timezone offsets (e.g., `2026-09-27T18:20:00.000+07:00`), respecting configured timezones or `process.env.TZ`.
- **Defensive Lifecycle Hygiene:** Flushes lingering tool timers on `agent_end`, `session_before_switch`, and `session_shutdown`.
- **Sanitizer Utility:** Includes `stripTimeAwareTags` to clean model outputs before displaying them to end users.

---

## Tag Formats

### 1. Standard Time Notice (User Inputs & Assistant Messages)
Appended to the end of user prompts and recorded in assistant messages:
```xml
<TimeAware>Time is 2026-09-27T15:30:00.000+07:00 (2 hours 15 minutes since session started, 14 minutes 2 seconds since previous message)</TimeAware>
```

### 2. Tool Duration Notice (Tool Results)
Appended to the end of text content in tool results:
```xml
<TimeAware>Tool took 1 second 340 milliseconds to run, finished at 2026-09-27T15:30:01.340+07:00</TimeAware>
```

---

## Installation

```bash
npm install github:misaalanshori/pi-time-aware
```

---

## Usage

### Option A: Using with Pi CLI

You can load `pi-time-aware` directly as a Pi extension:

```bash
pi --extension pi-time-aware
```

Or from a local checkout:

```bash
pi --extension ./path/to/pi-time-aware/dist/index.js
```

---

### Option B: Embedding via Pi SDK

```typescript
import { createAgentSession, DefaultResourceLoader } from "@earendil-works/pi-coding-agent";
import { createTimeAwareExtension, stripTimeAwareTags } from "pi-time-aware";

// 1. Create the extension with optional timezone configuration
const timeAware = createTimeAwareExtension({
  timeZone: "Asia/Jakarta", // defaults to process.env.TZ or UTC
});

// 2. Register it in your Pi ResourceLoader
const resourceLoader = new DefaultResourceLoader({
  cwd: sessionDir,
  extensionFactories: [timeAware],
});
await resourceLoader.reload();

// 3. Create your AgentSession
const { session } = await createAgentSession({
  cwd: sessionDir,
  resourceLoader,
});

// 4. Prompt the session
await session.prompt("What time is it and how long has this session been running?");

// 5. Clean output before sending to users (if you want the tag hidden)
const rawReply = session.getLastAssistantText();
const userVisibleReply = stripTimeAwareTags(rawReply);
console.log(userVisibleReply);
```

---

## API Reference

### `createTimeAwareExtension(options?: TimeAwareOptions)`
Factory that returns a Pi `ExtensionFactory` `(pi: ExtensionAPI) => void`.

#### Options:
- `timeZone?: string` — IANA timezone string (e.g. `"America/New_York"`, `"Asia/Jakarta"`, `"UTC"`).
- `sessionStartTime?: number` — Explicit Unix timestamp (ms) for session start.
- `nowFn?: () => Date` — Custom clock function for testing.

### `defaultTimeAwareExtension`
Default export matching Pi's dynamic extension loader contract (`pi.import(...)`). Uses `process.env.TZ` or UTC.

### `stripTimeAwareTags(text: string): string`
Regex helper that strips all `<TimeAware>...</TimeAware>` blocks and cleans extraneous trailing newlines.

### `formatIsoWithTz(date: Date, timeZone?: string): string`
Formats a JavaScript `Date` into an ISO 8601 string with an explicit timezone offset (e.g. `2026-09-27T15:30:00.000+07:00`).

---

## License

GNU General Public License v3.0 (GPL-3.0-only) © 2026 M Isa. See [LICENSE](LICENSE) for details.
