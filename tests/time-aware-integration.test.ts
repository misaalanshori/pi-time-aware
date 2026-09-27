import { describe, it, expect, vi } from "vitest";
import { createTimeAwareExtension } from "../src/extension.js";
import { stripTimeAwareTags } from "../src/formatter.js";

describe("TimeAware End-to-End Transcript Integration", () => {
  it("enriches conversation turn with timestamps while preserving clean client text", async () => {
    let mockTime = new Date("2026-09-27T12:00:00.000Z").getTime();
    const handlers: Record<string, Function> = {};
    const mockPi: any = {
      on: (event: string, handler: Function) => {
        handlers[event] = handler;
        return () => {};
      },
    };

    const ext = createTimeAwareExtension({
      nowFn: () => new Date(mockTime),
      sessionStartTime: mockTime,
    });
    ext(mockPi);

    // 1. Session start
    await handlers["session_start"]({}, {});

    // 2. Advance time 30s
    mockTime += 30_000;

    // 3. User input
    const inputRes = await handlers["input"](
      {
        type: "input",
        text: "Please search my notes for 'meeting'",
      },
      {}
    );
    expect(inputRes.action).toBe("transform");
    expect(inputRes.text).toContain("Please search my notes for 'meeting'");
    expect(inputRes.text).toContain(
      "<TimeAware>Time is 2026-09-27T12:00:30.000Z (30 seconds since session started, 30 seconds since previous message)</TimeAware>"
    );

    // 4. Model calls a tool
    await handlers["tool_call"](
      {
        toolName: "notes_search",
        toolCallId: "call-1",
        parameters: { query: "meeting" },
      },
      {}
    );

    // 5. Tool takes 250ms to run
    mockTime += 250;

    // 6. Tool result returns
    const toolRes = await handlers["tool_result"](
      {
        toolName: "notes_search",
        toolCallId: "call-1",
        content: [{ type: "text", text: "Found 1 note: 'Meeting at 3pm'" }],
      },
      {}
    );
    expect(toolRes.content[0].text).toContain("Found 1 note: 'Meeting at 3pm'");
    expect(toolRes.content[0].text).toContain(
      "<TimeAware>Tool took 250 milliseconds to run, finished at 2026-09-27T12:00:30.250Z</TimeAware>"
    );

    // 7. Advance time 500ms for LLM turn generation
    mockTime += 500;

    // 8. Assistant message completes
    const msgRes = await handlers["message_end"](
      {
        message: {
          role: "assistant",
          content: [
            {
              type: "text",
              text: "I found your note about the 3pm meeting.",
            },
          ],
        },
      },
      {}
    );

    const fullAssistantText = msgRes.message.content[0].text;
    expect(fullAssistantText).toContain("I found your note about the 3pm meeting.");
    expect(fullAssistantText).toContain(
      "<TimeAware>Time is 2026-09-27T12:00:30.750Z (30 seconds since session started, just now since previous message)</TimeAware>"
    );

    // 9. Client sanitization (what the user actually sees in WhatsApp)
    const userFacingText = stripTimeAwareTags(fullAssistantText);
    expect(userFacingText).toBe("I found your note about the 3pm meeting.");
    expect(userFacingText).not.toContain("<TimeAware>");
    expect(userFacingText).not.toContain("</TimeAware>");
  });
});
