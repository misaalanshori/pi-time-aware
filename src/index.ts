export {
  formatTimeDelta,
  formatDuration,
  formatStandardTimeNotice,
  formatToolDurationNotice,
  stripTimeAwareTags,
  type StandardTimeNoticeParams,
  type ToolDurationNoticeParams,
} from "./formatter.js";

export {
  createTimeAwareExtension,
  default as defaultTimeAwareExtension,
  type TimeAwareOptions,
} from "./extension.js";
