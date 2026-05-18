import type { LiveUpdatesSocketLike } from "./liveUpdateModel";
import { SOCKET_CONNECTING, SOCKET_OPEN } from "./liveUpdateModel";

export function resolveLiveCompanyId(
  selectedCompanyId: string | null,
  selectedCompanyLiveId: string | null,
): string | null {
  return selectedCompanyId && selectedCompanyId === selectedCompanyLiveId
    ? selectedCompanyId
    : null;
}

export function resetSocketHandlers(target: LiveUpdatesSocketLike) {
  target.onopen = null;
  target.onmessage = null;
  target.onerror = null;
  target.onclose = null;
}

export function closeSocketQuietly(target: LiveUpdatesSocketLike | null, reason: string) {
  if (!target) return;

  if (target.readyState === SOCKET_CONNECTING) {
    // Let the handshake complete before closing to avoid noisy browser errors.
    target.onopen = () => {
      resetSocketHandlers(target);
      target.close(1000, reason);
    };
    target.onmessage = null;
    target.onerror = () => undefined;
    target.onclose = null;
    return;
  }

  resetSocketHandlers(target);

  if (target.readyState === SOCKET_OPEN) {
    target.close(1000, reason);
  }
}
