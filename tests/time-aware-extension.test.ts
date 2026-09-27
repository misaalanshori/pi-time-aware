import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTimeAwareExtension } from "../src/extension.js";

describe("TimeAware Extension", () => {
  let handlers: Record<string, Function>;
  let mockPi: any;

  beforeEach(() => {
    handlers = {};
    mockPi = {
      on: vi.fn().mockImplementation((event: string, handler: Function) => {
        handlers[event] = handler;
        return () => {
          delete handlers[event];
        };
      }),
    };
  });

  it("registers all required lifecycle handlers", () => {
    const ext = createTimeAwareExtension();
    ext(mockPi);

    expect(handlers["session_start"]).toBeTypeOf("function");
    expect(handlers["input"]).toBeTypeOf("function");
    expect(handlers["tool_call"]).toBeTypeOf("function");
    expect(handlers["tool_result"]).toBeTypeOf("function");
    expect(handlers["message_end"]).toBeTypeOf("function");
  });

  it("transforms user input by appending <TimeAware> standard notice at the end", async () => {
    const startTime = new Date("2026-09-27T10:00:00.000Z").getTime();
    const ext = createTimeAwareExtension({
      nowFn: () => new Date("2026-09-27T10:05:00.000Z"),
      sessionStartTime: startTime,
    });
    ext(mockPi);

    const result = await handlers["input"](
      {
        type: "input",
        text: "Please check my reminder list",
        source: "interactive",
      },
      {}
    );

    expect(result).toBeDefined();
    expect(result.action).toBe("transform");
    expect(result.text).toContain("Please check my reminder list");
    expect(result.text).toContain(
      "<TimeAware>Time is 2026-09-27T10:05:00.000Z (5 minutes since session started, 5 minutes since previous message)</TimeAware>"
    );
    // Notice must be at the end to be cache-safe
    expect(result.text.endsWith("</TimeAware>")).toBe(true);
  });

  it("measures tool duration and appends duration notice to tool_result", async () => {
    let mockTime = 1000;
    const ext = createTimeAwareExtension({
      nowFn: () => new Date(mockTime),
    });
    ext(mockPi);

    // 1. Tool call starts at t=1000
    await handlers["tool_call"](
      {
        toolName: "sqlite_storage",
        toolCallId: "call-abc",
        parameters: { action: "schema" },
      },
      {}
    );

    // 2. Advance time by 450ms
    mockTime = 1450;

    // 3. Tool result arrives
    const res = await handlers["tool_result"](
      {
        toolName: "sqlite_storage",
        toolCallId: "call-abc",
        content: [{ type: "text", text: "Database schema with 2 tables." }],
      },
      {}
    );

    expect(res).toBeDefined();
    expect(res.content).toHaveLength(1);
    expect(res.content[0].text).toContain("Database schema with 2 tables.");
    expect(res.content[0].text).toContain(
      "<TimeAware>Tool took 450 milliseconds to run, finished at 1970-01-01T00:00:01.450Z</TimeAware>"
    );
  });

  it("appends <TimeAware> to assistant messages on message_end", async () => {
    const startTime = new Date("2026-09-27T10:00:00.000Z").getTime();
    const ext = createTimeAwareExtension({
      nowFn: () => new Date("2026-09-27T10:01:00.000Z"),
      sessionStartTime: startTime,
    });
    ext(mockPi);

    const assistantMsg = {
      role: "assistant",
      content: [{ type: "text", text: "I have updated your schedule." }],
    };

    const res = await handlers["message_end"](
      {
        message: assistantMsg,
      },
      {}
    );

    expect(res).toBeDefined();
    expect(res.message.role).toBe("assistant");
    expect(res.message.content[0].text).toContain("I have updated your schedule.");
    expect(res.message.content[0].text).toContain(
      "<TimeAware>Time is 2026-09-27T10:01:00.000Z (1 minute since session started, 1 minute since previous message)</TimeAware>"
    );
  });
});
