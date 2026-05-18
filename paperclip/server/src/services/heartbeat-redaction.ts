import {
  redactCurrentUserText,
  type CurrentUserRedactionOptions,
} from "../log-redaction.js";
import { redactSensitiveText } from "../redaction.js";

export function redactDetectedSuccessfulRunProgressSummaryForBoard(
  summary: string,
  currentUserRedactionOptions?: CurrentUserRedactionOptions,
) {
  const normalized = summary.replace(/\s+/g, " ").trim();
  const redacted = redactSensitiveText(redactCurrentUserText(normalized, currentUserRedactionOptions));
  return redacted.length <= 280 ? redacted : `${redacted.slice(0, 277)}...`;
}
