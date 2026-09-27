import { describe, it, expect, vi } from "vitest";
import { createTimeAwareExtension } from "../src/extension.js";

describe("Session History & Recovery", () => {
  it("recovers sessionStartTime and lastMessageTime from SessionManager", async () => {
    const handlers: Record<string, Function> = {};
    const mockPi: any = {
      on: (event: string, handler: Function) => {
        handlers[event] = handler;
        return () => {};
      },
    };

    const sessionCreatedTime = new Date("2026-09-20T10:00:00.000Z").getTime(); // 7 days ago
    const lastEntryTime = new Date("2026-09-27T08:00:00.000Z").getTime(); // 2 hours ago
    const currentTime = new Date("2026-09-27T10:00:00.000Z").getTime(); // now

    const mockCtx: any = {
      sessionManager: {
        getHeader: vi.fn().mockReturnValue({
          type: "session",
          timestamp: new Date(sessionCreatedTime).toISOString(),
        }),
        getEntries: vi.fn().mockReturnValue([
          {
            type: "message",
            timestamp: new Date(lastEntryTime).toISOString(),
          },
        ]),
      },
    };

    const ext = createTimeAwareExtension({
      nowFn: () => new Date(currentTime),
    });
    ext(mockPi);

    // 1. Session start with resume context
    await handlers["session_start"]({ reason: "resume" }, mockCtx);

    // 2. User input
    const inputRes = await handlers["input"]({ text: "Hello again" }, mockCtx);

    // 3. Verifies that elapsed time accurately measures from the original session creation (7 days)
    // and last message (2 hours), NOT from when the process launched!
    expect(inputRes.text).toContain("7 days since session started");
    expect(inputRes.text).toContain("2 hours since previous message");
  });

  it("clears tool start times on session_shutdown and session_before_switch", async () => {
    const handlers: Record<string, Function> = {};
    const mockPi: any = {
      on: (event: string, handler: Function) => {
        handlers[event] = handler;
        return () => {};
      },
    };

    const ext = createTimeAwareExtension();
    ext(mockPi);

    expect(handlers["session_shutdown"]).toBeTypeOf("function");
    expect(handlers["session_before_switch"]).toBeTypeOf("function");

    // Start a tool call
    await handlers["tool_call"]({ toolCallId: "abandoned-tool" }, {});

    // Session shutdown occurs
    await handlers["session_shutdown"]({}, {});

    // If result arrives after shutdown, it should not use stale start time
    const res = await handlers["tool_result"](
      { toolCallId: "abandoned-tool", content: [{ type: "text", text: "Done" }] },
      {}
    );
    expect(res.content[0].text).toContain("Tool took");
  });
});
