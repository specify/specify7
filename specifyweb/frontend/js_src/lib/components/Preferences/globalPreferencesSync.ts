type GlobalPreferencesUpdateListener = (data: string) => void;

const listeners = new Set<GlobalPreferencesUpdateListener>();

export function subscribeToGlobalPreferencesUpdates(
  listener: GlobalPreferencesUpdateListener
): () => void {
  listeners.add(listener);
  return (): void => {
    listeners.delete(listener);
  };
}

export function notifyGlobalPreferencesUpdated(data: string): void {
  listeners.forEach((listener) => {
    listener(data);
  });
}
