import { describe, it, expect } from "vitest";
import { createTimeAwareExtension } from "../../src/extension.js";
import { formatTimeDelta } from "../../src/formatter.js";

describe("Regression: Clock skew and negative deltas", () => {
  it("clamps negative deltas from clock adjustments to 'just now'", () => {
    expect(formatTimeDelta(-5000)).toBe("just now");
    expect(formatTimeDelta(-1)).toBe("just now");
  });

  it("handles clock jumping backwards during session", async () => {
    let mockTime = 100_000;
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

    // Clock jumps backwards 10s
    mockTime = 90_000;

    const res = await handlers["input"]({ text: "Hello" }, {});
    expect(res.text).toContain("just now since session started");
  });
});
