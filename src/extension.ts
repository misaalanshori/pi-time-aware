import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { formatStandardTimeNotice, formatToolDurationNotice } from "./formatter.js";

export interface TimeAwareOptions {
  nowFn?: () => Date;
  sessionStartTime?: number;
}

export function createTimeAwareExtension(options: TimeAwareOptions = {}) {
  return (pi: ExtensionAPI) => {
    const getNow = options.nowFn ? () => options.nowFn!() : () => new Date();

    let sessionStartTime = options.sessionStartTime ?? getNow().getTime();
    let lastMessageTime = sessionStartTime;
    const toolStartTimes = new Map<string, number>();

    pi.on("session_start", (_event: any) => {
      if (!options.sessionStartTime) {
        sessionStartTime = getNow().getTime();
        lastMessageTime = sessionStartTime;
      }
    });

    pi.on("input", (event: any) => {
      const now = getNow();
      const notice = formatStandardTimeNotice({
        now,
        sessionStartTime,
        lastMessageTime,
      });

      lastMessageTime = now.getTime();

      const originalText = (event.text || "").trim();
      const newText = originalText.length > 0 ? `${originalText}\n\n${notice}` : notice;

      return {
        action: "transform" as const,
        text: newText,
      };
    });

    pi.on("tool_call", (event: any) => {
      if (event.toolCallId) {
        toolStartTimes.set(event.toolCallId, getNow().getTime());
      }
    });

    pi.on("tool_result", (event: any) => {
      const finishedAt = getNow();
      const startTime = toolStartTimes.get(event.toolCallId) ?? finishedAt.getTime();
      toolStartTimes.delete(event.toolCallId);

      const durationMs = Math.max(0, finishedAt.getTime() - startTime);
      const notice = formatToolDurationNotice({
        durationMs,
        finishedAt,
      });

      const currentContent = Array.isArray(event.content) ? [...event.content] : [];
      let updated = false;

      // Find the last text block to append the duration notice
      for (let i = currentContent.length - 1; i >= 0; i--) {
        const block = currentContent[i];
        if (block && block.type === "text" && typeof block.text === "string") {
          currentContent[i] = {
            ...block,
            text: `${block.text.trim()}\n\n${notice}`,
          };
          updated = true;
          break;
        }
      }

      if (!updated) {
        currentContent.push({
          type: "text",
          text: notice,
        });
      }

      return {
        content: currentContent,
      };
    });

    pi.on("message_end", (event: any) => {
      if (event.message?.role === "assistant") {
        const now = getNow();
        const notice = formatStandardTimeNotice({
          now,
          sessionStartTime,
          lastMessageTime,
        });

        lastMessageTime = now.getTime();

        const currentMsg = { ...event.message };
        const content = Array.isArray(currentMsg.content) ? [...currentMsg.content] : [];
        let updated = false;

        for (let i = content.length - 1; i >= 0; i--) {
          const block = content[i];
          if (block && block.type === "text" && typeof block.text === "string") {
            // Avoid double appending if already present
            if (!block.text.includes("</TimeAware>")) {
              content[i] = {
                ...block,
                text: `${block.text.trim()}\n\n${notice}`,
              };
            }
            updated = true;
            break;
          }
        }

        if (!updated) {
          content.push({
            type: "text",
            text: notice,
          });
        }

        currentMsg.content = content;
        return {
          message: currentMsg,
        };
      }
    });
  };
}

export default function defaultTimeAwareExtension(pi: ExtensionAPI) {
  createTimeAwareExtension()(pi);
}
