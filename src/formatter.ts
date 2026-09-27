export function formatTimeDelta(ms: number): string {
  if (isNaN(ms) || ms < 1000) {
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
  const safeMs = isNaN(ms) ? 0 : Math.max(0, ms);

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
  timeZone?: string;
}

export function toDate(input: Date | string | number): Date {
  const d = input instanceof Date ? input : new Date(input);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function formatIsoWithTz(date: Date, timeZone?: string): string {
  if (!timeZone || timeZone.toUpperCase() === "UTC") {
    return date.toISOString();
  }
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
      hourCycle: "h23",
    }).formatToParts(date);
    const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const tzPart = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value;
    const cleanOffset = tzPart
      ? tzPart.replace(/^GMT/i, "").trim().replace(/\u2212/g, "-")
      : "Z";
    return `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}:${m.second}.${m.fractionalSecond}${cleanOffset || "Z"}`;
  } catch {
    return date.toISOString();
  }
}

export function formatStandardTimeNotice(params: StandardTimeNoticeParams): string {
  const nowDate = toDate(params.now);
  const startDate = toDate(params.sessionStartTime);
  const lastDate = toDate(params.lastMessageTime);

  const nowMs = nowDate.getTime();
  const timeSinceStart = formatTimeDelta(Math.max(0, nowMs - startDate.getTime()));
  const timeSinceLast = formatTimeDelta(Math.max(0, nowMs - lastDate.getTime()));
  const isoStr = formatIsoWithTz(nowDate, params.timeZone);

  return `<TimeAware>Time is ${isoStr} (${timeSinceStart} since session started, ${timeSinceLast} since previous message)</TimeAware>`;
}

export interface ToolDurationNoticeParams {
  durationMs: number;
  finishedAt: Date | string | number;
  timeZone?: string;
}

export function formatToolDurationNotice(params: ToolDurationNoticeParams): string {
  const finishedDate = toDate(params.finishedAt);
  const durationStr = formatDuration(params.durationMs);
  const isoStr = formatIsoWithTz(finishedDate, params.timeZone);

  return `<TimeAware>Tool took ${durationStr} to run, finished at ${isoStr}</TimeAware>`;
}

export function stripTimeAwareTags(text: string): string {
  if (!text) return "";
  return text
    .replace(/<TimeAware>[\s\S]*?<\/TimeAware>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
