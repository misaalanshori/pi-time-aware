import { describe, it, expect } from "vitest";
import { createTimeAwareExtension } from "../../src/extension.js";

describe("Regression: Concurrent tool calls duration tracking", () => {
  it("tracks start times independently for concurrent tool calls", async () => {
    let mockTime = 1000;
    const handlers: Record<string, Function> = {};
    const mockPi: any = {
      on: (event: string, handler: Function) => {
        handlers[event] = handler;
        return () => {};
      },
    };

    const ext = createTimeAwareExtension({
      nowFn: () => new Date(mockTime),
    });
    ext(mockPi);

    // Tool 1 starts at t=1000
    await handlers["tool_call"]({ toolCallId: "call-1" }, {});

    // Tool 2 starts at t=1100
    mockTime = 1100;
    await handlers["tool_call"]({ toolCallId: "call-2" }, {});

    // Tool 2 finishes at t=1300 (duration: 200ms)
    mockTime = 1300;
    const res2 = await handlers["tool_result"](
      { toolCallId: "call-2", content: [{ type: "text", text: "Tool 2 done" }] },
      {}
    );
    expect(res2.content[0].text).toContain("Tool took 200 milliseconds to run");

    // Tool 1 finishes at t=1600 (duration: 600ms)
    mockTime = 1600;
    const res1 = await handlers["tool_result"](
      { toolCallId: "call-1", content: [{ type: "text", text: "Tool 1 done" }] },
      {}
    );
    expect(res1.content[0].text).toContain("Tool took 600 milliseconds to run");
  });
});
