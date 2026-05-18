import type { ToastInput } from "../ToastContext";
import type { ToastGate } from "./liveUpdateModel";
import { recordToastHit, shouldSuppressToast } from "./liveUpdateModel";

export function gatedPushToast(
  gate: ToastGate,
  pushToast: (toast: ToastInput) => string | null,
  category: string,
  toast: ToastInput,
) {
  if (shouldSuppressToast(gate, category)) return;
  const id = pushToast(toast);
  if (id !== null) recordToastHit(gate, category);
}
