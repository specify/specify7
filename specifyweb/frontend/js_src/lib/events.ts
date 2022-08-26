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
    callback: (payload: TYPE[EVENT_NAME]) => void,
    // Call the callback for the first time as soon as even listener is setup
    immediate = false
  ): () => void {
    const handler = (event: Event) =>
      callback(
        ((event as CustomEvent).detail ?? undefined) as TYPE[EVENT_NAME]
      );
    eventTarget.addEventListener(eventName, handler);
    if (immediate) callback(undefined as TYPE[EVENT_NAME]);
    return (): void => eventTarget.removeEventListener(eventName, handler);
  },
  trigger: <EVENT_NAME extends string & keyof TYPE>(
    eventName: EVENT_NAME,
    // If payload type is undefined, don't allow second argument
    ...[payload]: TYPE[EVENT_NAME] extends undefined
      ? readonly []
      : readonly [TYPE[EVENT_NAME]]
  ): boolean =>
    eventTarget.dispatchEvent(new CustomEvent(eventName, { detail: payload })),
});

export function listen<EVENT_NAME extends keyof GlobalEventHandlersEventMap>(
  element: EventTarget,
  eventName: EVENT_NAME,
  callback: (event: GlobalEventHandlersEventMap[EVENT_NAME]) => void,
  catchAll = false
): () => void {
  element.addEventListener(
    eventName,
    callback as (event: Event) => void,
    catchAll
  );
  return (): void =>
    element.removeEventListener(
      eventName,
      callback as (event: Event) => void,
      catchAll
    );
}
