export function formatTimeDelta(ms: number): string {
  if (ms < 1000) {
    return "just now";
  }

  const secondsTotal = Math.floor(ms / 1000);
  const days = Math.floor(secondsTotal / 86400);
  const hours = Math.floor((secondsTotal % 86400) / 3600);
  const minutes = Math.floor((secondsTotal % 3600) / 60);
  const seconds = secondsTotal % 60;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);
  }

  return parts.join(" ");
}

export function formatDuration(ms: number): string {
  const safeMs = Math.max(0, ms);

  if (safeMs < 1000) {
    return `${safeMs} ${safeMs === 1 ? "millisecond" : "milliseconds"}`;
  }

  if (safeMs < 10_000) {
    const seconds = Math.floor(safeMs / 1000);
    const remainderMs = safeMs % 1000;
    const secPart = `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
    if (remainderMs > 0) {
      return `${secPart} ${remainderMs} ${remainderMs === 1 ? "millisecond" : "milliseconds"}`;
    }
    return secPart;
  }

  return formatTimeDelta(safeMs);
}

export interface StandardTimeNoticeParams {
  now: Date | string | number;
  sessionStartTime: Date | string | number;
  lastMessageTime: Date | string | number;
}

export function toDate(input: Date | string | number): Date {
  return input instanceof Date ? input : new Date(input);
}

export function formatStandardTimeNotice(params: StandardTimeNoticeParams): string {
  const nowDate = toDate(params.now);
  const startDate = toDate(params.sessionStartTime);
  const lastDate = toDate(params.lastMessageTime);

  const nowMs = nowDate.getTime();
  const timeSinceStart = formatTimeDelta(Math.max(0, nowMs - startDate.getTime()));
  const timeSinceLast = formatTimeDelta(Math.max(0, nowMs - lastDate.getTime()));

  return `<TimeAware>Time is ${nowDate.toISOString()} (${timeSinceStart} since session started, ${timeSinceLast} since previous message)</TimeAware>`;
}

export interface ToolDurationNoticeParams {
  durationMs: number;
  finishedAt: Date | string | number;
}

export function formatToolDurationNotice(params: ToolDurationNoticeParams): string {
  const finishedDate = toDate(params.finishedAt);
  const durationStr = formatDuration(params.durationMs);

  return `<TimeAware>Tool took ${durationStr} to run, finished at ${finishedDate.toISOString()}</TimeAware>`;
}

export function stripTimeAwareTags(text: string): string {
  if (!text) return "";
  return text
    .replace(/<TimeAware>[\s\S]*?<\/TimeAware>/gi, "")
    .trim();
}
