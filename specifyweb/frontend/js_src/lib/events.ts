import type { IR } from './types';

/**
 * A type safe event implementation using native events.
 * The API is largely compatible with the Backbones Events API
 */
export const eventListener = <TYPE extends IR<unknown>>(
  eventTarget = new EventTarget()
) => ({
  // Returns event destructor to encourage cleaning up event listeners afterward
  on<EVENT_NAME extends string & keyof TYPE>(
    eventName: EVENT_NAME,
    callback: (payload: TYPE[EVENT_NAME]) => void
  ): () => void {
    const handler = (event: Event) =>
      callback((event as CustomEvent).detail as TYPE[EVENT_NAME]);
    eventTarget.addEventListener(eventName, handler);
    return (): void => eventTarget.removeEventListener(eventName, handler);
  },
  trigger: <EVENT_NAME extends string & keyof TYPE>(
    eventName: EVENT_NAME,
    payload: TYPE[EVENT_NAME]
  ): boolean =>
    eventTarget.dispatchEvent(new CustomEvent(eventName, { detail: payload })),
});
