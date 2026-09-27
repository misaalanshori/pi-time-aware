import { describe, it, expect, vi } from "vitest";
import defaultTimeAwareExtension, {
  createTimeAwareExtension,
  toDate,
  formatTimeDelta,
  formatDuration,
  formatIsoWithTz,
} from "../src/index.js";

describe("Pi Extension Default Export & Loader Compliance", () => {
  it("provides a valid callable default export matching Pi ExtensionFactory signature", () => {
    expect(typeof defaultTimeAwareExtension).toBe("function");

    const handlers: Record<string, Function> = {};
    const mockPi: any = {
      on: (event: string, handler: Function) => {
        handlers[event] = handler;
        return () => {};
      },
    };

    // Pi loader invokes: defaultExport(pi)
    defaultTimeAwareExtension(mockPi);

    expect(handlers["session_start"]).toBeTypeOf("function");
    expect(handlers["input"]).toBeTypeOf("function");
    expect(handlers["tool_call"]).toBeTypeOf("function");
    expect(handlers["tool_result"]).toBeTypeOf("function");
    expect(handlers["message_end"]).toBeTypeOf("function");
    expect(handlers["session_shutdown"]).toBeTypeOf("function");
    expect(handlers["session_before_switch"]).toBeTypeOf("function");
    expect(handlers["agent_end"]).toBeTypeOf("function");
  });

  it("handles NaN, invalid dates, and edge case numbers defensively", () => {
    expect(toDate("not-a-date")).toBeInstanceOf(Date);
    expect(isNaN(toDate("not-a-date").getTime())).toBe(false);

    expect(formatTimeDelta(NaN)).toBe("just now");
    expect(formatTimeDelta(-100)).toBe("just now");
    expect(formatDuration(NaN)).toBe("0 milliseconds");

    const midnight = new Date("2026-09-27T00:00:00.000Z");
    const iso = formatIsoWithTz(midnight, "UTC");
    expect(iso).toBe("2026-09-27T00:00:00.000Z");
  });

  it("clears active tool timers on agent_end", async () => {
    const handlers: Record<string, Function> = {};
    const mockPi: any = {
      on: (event: string, handler: Function) => {
        handlers[event] = handler;
        return () => {};
      },
    };

    const ext = createTimeAwareExtension();
    ext(mockPi);

    await handlers["tool_call"]({ toolCallId: "call-1" });
    await handlers["agent_end"]();

    // After agent_end, tool timer is cleared so subsequent result safely uses current time without stale duration
    const res = await handlers["tool_result"](
      { toolCallId: "call-1", content: [{ type: "text", text: "result" }] },
      {}
    );
    expect(res.content[0].text).toContain("Tool took");
  });
});
