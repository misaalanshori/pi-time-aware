import { describe, it, expect } from "vitest";
import {
  formatTimeDelta,
  formatDuration,
  formatStandardTimeNotice,
  formatToolDurationNotice,
  stripTimeAwareTags,
} from "../src/formatter.js";

describe("formatTimeDelta", () => {
  it("formats sub-second deltas as 'just now'", () => {
    expect(formatTimeDelta(0)).toBe("just now");
    expect(formatTimeDelta(450)).toBe("just now");
    expect(formatTimeDelta(-100)).toBe("just now"); // clamps negative
  });

  it("formats seconds correctly with plurals", () => {
    expect(formatTimeDelta(1000)).toBe("1 second");
    expect(formatTimeDelta(5000)).toBe("5 seconds");
  });

  it("formats minutes and seconds", () => {
    expect(formatTimeDelta(60_000)).toBe("1 minute");
    expect(formatTimeDelta(65_000)).toBe("1 minute 5 seconds");
    expect(formatTimeDelta(120_000)).toBe("2 minutes");
  });

  it("formats hours, minutes, and seconds", () => {
    // 2h 23m 6s = (2*3600 + 23*60 + 6)*1000 = 8586000ms
    expect(formatTimeDelta(8_586_000)).toBe("2 hours 23 minutes 6 seconds");
  });

  it("formats days, hours, minutes, seconds", () => {
    // 1d 2h 0m 5s = (86400 + 7200 + 5)*1000 = 93605000ms
    expect(formatTimeDelta(93_605_000)).toBe("1 day 2 hours 5 seconds");
  });
});

describe("formatDuration", () => {
  it("formats sub-second tool durations with milliseconds", () => {
    expect(formatDuration(340)).toBe("340 milliseconds");
    expect(formatDuration(1)).toBe("1 millisecond");
  });

  it("formats short durations (<10s) with seconds and milliseconds", () => {
    expect(formatDuration(1340)).toBe("1 second 340 milliseconds");
    expect(formatDuration(2000)).toBe("2 seconds");
  });

  it("formats longer durations without milliseconds", () => {
    expect(formatDuration(15_000)).toBe("15 seconds");
    expect(formatDuration(65_000)).toBe("1 minute 5 seconds");
  });
});

describe("formatStandardTimeNotice", () => {
  it("generates correct TimeAware tag with ISO 8601 and deltas", () => {
    const now = new Date("2026-09-27T11:20:00.000Z");
    const sessionStartTime = new Date(now.getTime() - 8_586_000); // 2h 23m 6s ago
    const lastMessageTime = new Date(now.getTime() - 842_000); // 14m 2s ago

    const notice = formatStandardTimeNotice({
      now,
      sessionStartTime,
      lastMessageTime,
    });

    expect(notice).toBe(
      "<TimeAware>Time is 2026-09-27T11:20:00.000Z (2 hours 23 minutes 6 seconds since session started, 14 minutes 2 seconds since previous message)</TimeAware>"
    );
  });
});

describe("formatToolDurationNotice", () => {
  it("generates correct Tool took duration notice with finishedAt ISO", () => {
    const finishedAt = new Date("2026-09-27T11:20:01.340Z");
    const notice = formatToolDurationNotice({
      durationMs: 1340,
      finishedAt,
    });

    expect(notice).toBe(
      "<TimeAware>Tool took 1 second 340 milliseconds to run, finished at 2026-09-27T11:20:01.340Z</TimeAware>"
    );
  });
});

describe("stripTimeAwareTags", () => {
  it("strips single-line TimeAware tags cleanly", () => {
    const text =
      "Hello world!\n\n<TimeAware>Time is 2026-09-27T11:20:00.000Z (just now since session started, just now since previous message)</TimeAware>";
    expect(stripTimeAwareTags(text)).toBe("Hello world!");
  });

  it("strips multiple TimeAware tags", () => {
    const text =
      "<TimeAware>Time is 2026-09-27T11:20:00.000Z</TimeAware>\nSome text\n<TimeAware>Tool took 1s</TimeAware>";
    expect(stripTimeAwareTags(text)).toBe("Some text");
  });

  it("strips multiline TimeAware tags", () => {
    const text =
      "Answer here.\n\n<TimeAware>\nTime is 2026-09-27T11:20:00.000Z\n</TimeAware>";
    expect(stripTimeAwareTags(text)).toBe("Answer here.");
  });

  it("returns unchanged text when no TimeAware tags are present", () => {
    const text = "Normal conversation without tags.";
    expect(stripTimeAwareTags(text)).toBe(text);
  });
});
