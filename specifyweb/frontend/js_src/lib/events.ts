import { f } from './functools';
import type { Input } from './saveblockers';
import type { IR } from './types';
import { defined } from './types';

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
    // If payload type is undefined, don't require second argument
    ...[payload]: TYPE[EVENT_NAME] extends undefined
      ? readonly []
      : readonly [TYPE[EVENT_NAME]]
  ): boolean =>
    // Disable events when running tests as Node.JS does not support CustomEvent
    process.env.NODE_ENV === 'test'
      ? true
      : eventTarget.dispatchEvent(
          new CustomEvent(eventName, { detail: payload })
        ),
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

/**
 * Some hooks (useResourceValue) need to do some actions on focus loss
 * For some inputs (Autocomplete), blur event and focus loss are not equivalent,
 * (input may transfer its focus to the autocomplete list and back)
 * These functions allow registering custom blur event emitters and listeners
 */
const blurHandlers = new Map<
  Input,
  {
    // eslint-disable-next-line functional/prefer-readonly-type
    readonly listeners: Set<() => void>;
    /*
     * If there are no listeners left and only a default emitter, it would get
     * destroyed
     */
    readonly isDefault: boolean;
    readonly emitterDestructor: () => void;
  }
>();

export function registerBlurEmitter(
  input: Input,
  // If this is not provided, native blur event is used as an emitter
  emitter?: (emit: () => void) => () => void
): () => void {
  const oldEntry = blurHandlers.get(input);
  oldEntry?.emitterDestructor?.();
  const emit = (): void => blurHandlers.get(input)?.listeners.forEach(f.call);
  const entry = {
    listeners: oldEntry?.listeners ?? new Set(),
    emitterDestructor: emitter?.(emit) ?? listen(input, 'blur', emit),
    isDefault: emitter === undefined,
  };
  blurHandlers.set(input, entry);
  return (): void => {
    if (entry.listeners.size === 0) {
      blurHandlers.delete(input);
      entry.emitterDestructor?.();
    } else if (typeof emitter === 'function')
      // If there are listeners still, register a default emitter
      registerBlurEmitter(input);
    else entry.emitterDestructor?.();
  };
}

export function registerBlurListener(
  input: Input,
  callback: () => void
): () => void {
  // If emitter does not exist, use the default one
  if (!blurHandlers.has(input)) registerBlurEmitter(input);
  const entry = defined(blurHandlers.get(input));
  entry.listeners.add(callback);
  return (): void => {
    entry.listeners.delete(callback);
    if (entry.listeners.size === 0 && entry.isDefault) {
      const entry = defined(blurHandlers.get(input));
      entry.emitterDestructor?.();
      blurHandlers.delete(input);
    }
  };
}
