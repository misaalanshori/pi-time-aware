import { describe, it, expect } from "vitest";
import { createTimeAwareExtension } from "../../src/extension.js";

describe("Regression: Tool result with non-text or empty content blocks", () => {
  it("appends text block with duration notice when tool returns empty content array", async () => {
    const handlers: Record<string, Function> = {};
    const mockPi: any = {
      on: (event: string, handler: Function) => {
        handlers[event] = handler;
        return () => {};
      },
    };

    const ext = createTimeAwareExtension({
      nowFn: () => new Date(1000),
    });
    ext(mockPi);

    await handlers["tool_call"]({ toolCallId: "call-empty" }, {});
    const res = await handlers["tool_result"](
      {
        toolCallId: "call-empty",
        content: [],
      },
      {}
    );

    expect(res.content).toHaveLength(1);
    expect(res.content[0].type).toBe("text");
    expect(res.content[0].text).toContain("<TimeAware>Tool took");
  });

  it("appends text block when tool returns only image content blocks", async () => {
    const handlers: Record<string, Function> = {};
    const mockPi: any = {
      on: (event: string, handler: Function) => {
        handlers[event] = handler;
        return () => {};
      },
    };

    const ext = createTimeAwareExtension({
      nowFn: () => new Date(1000),
    });
    ext(mockPi);

    await handlers["tool_call"]({ toolCallId: "call-img" }, {});
    const res = await handlers["tool_result"](
      {
        toolCallId: "call-img",
        content: [{ type: "image", data: "base64", mimeType: "image/png" }],
      },
      {}
    );

    expect(res.content).toHaveLength(2);
    expect(res.content[0].type).toBe("image");
    expect(res.content[1].type).toBe("text");
    expect(res.content[1].text).toContain("<TimeAware>Tool took");
  });
});
