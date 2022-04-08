import React from 'react';

import type { AnySchema } from '../datamodelutils';
import { getDateInputValue } from '../dayjs';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import * as navigation from '../navigation';
import type { Input } from '../saveblockers';
import type { R, RA } from '../types';
import type { Parser } from '../uiparse';
import { parseValue, resolveParser } from '../uiparse';
import { isInputTouched } from '../validationmessages';
import { LoadingContext } from './contexts';
import { FormContext } from './resourceview';

const idStore: R<number> = {};

/**
 * A hook that returns a unique string ID generator that is unique
 * and unchanging for the lifecycle of a component
 *
 * @remarks
 * No matter which prefix is chosen, the final id is guaranteed to be unique
 * among all components. Thus, you shouldn't worry about prefixes being globally
 * unique. The specific prefix does not matter at all, except it makes debugging
 * easier.
 */
export function useId(prefix: string): (suffix: string) => string {
  const id = React.useRef(-1);

  const resolvedPrefix = `${prefix}-`;

  if (!(resolvedPrefix in idStore)) idStore[resolvedPrefix] = 0;

  if (id.current === -1) {
    id.current = idStore[resolvedPrefix];
    idStore[resolvedPrefix] += 1;
  }

  return React.useCallback(
    (suffix = ''): string =>
      `${resolvedPrefix}${id.current}${suffix ? `-${suffix}` : ''}`,
    [resolvedPrefix]
  );
}

export function setTitle(title: string): void {
  window.document.title = commonText('appTitle')(title);
}

/** Set title of the webpage. Restores previous title on component destruction */
export function useTitle(title: string): void {
  // Reset title after component is destroyed
  React.useEffect(() => {
    const initialTitle = document.title;
    return (): void => {
      document.title = initialTitle;
    };
  }, []);

  // Change page's title
  React.useEffect(() => {
    setTitle(title);
  }, [title]);
}

/**
 * An integration into native browser error reporting mechanism.
 * Can set an error message via prop or callback.
 * Hides the error message on input
 *
 * @remarks
 * For performance reasons, this hook does not cause state update when setting
 * validation message. Thus, you can call it on keydown to implement live
 * validation
 */
export function useValidation<T extends Input = HTMLInputElement>(
  // Can set validation message from state or a prop
  message: string | RA<string> = ''
): {
  // Set this as a ref prop on an input
  readonly validationRef: React.RefCallback<T>;
  // If need access to the underlying inputRef, can use this prop
  readonly inputRef: React.MutableRefObject<T | null>;
  // Can set validation message via this callback
  readonly setValidation: (message: string | RA<string>) => void;
} {
  const inputRef = React.useRef<T | null>(null);

  /*
   * Store last validation message in case inputRef.current is null at the moment
   * This happens if setValidation is called for an input that is not currently
   * rendered
   */
  const validationMessageRef = React.useRef<string>(
    Array.isArray(message) ? message.join('\n') : message
  );

  // Clear validation message on typing
  React.useEffect(() => {
    if (!inputRef.current) return undefined;
    const input = inputRef.current;

    function handleChange(): void {
      if (input.validity.customError) {
        validationMessageRef.current = '';
        input.setCustomValidity('');
      }
    }

    input.addEventListener('input', handleChange);
    return (): void => input.removeEventListener('input', handleChange);
  }, []);

  // Display validation message on focus
  const isFirstFocus = React.useRef<boolean>(true);
  React.useEffect(() => {
    if (!inputRef.current) return undefined;
    const input = inputRef.current;

    function handleFocus(): void {
      if (isFirstFocus.current) isFirstFocus.current = false;
      else input.reportValidity();
    }

    input.addEventListener('focus', handleFocus);
    return (): void => input.removeEventListener('focus', handleFocus);
  }, []);

  const setValidation = React.useCallback(function setValidation(
    message: string | RA<string>
  ): void {
    const joined = Array.isArray(message) ? message.join('\n') : message;
    if (validationMessageRef.current === joined) return;

    validationMessageRef.current = joined;
    const input = inputRef.current;
    if (!input) return;
    // Empty string clears validation error
    input.setCustomValidity(joined);

    if (joined !== '' && isInputTouched(input)) input.reportValidity();
  },
  []);

  React.useEffect(() => setValidation(message), [message, setValidation]);

  return {
    inputRef,
    validationRef: React.useCallback(
      (input): void => {
        inputRef.current = input;
        setValidation(validationMessageRef.current);
      },
      [setValidation]
    ),
    setValidation,
  };
}

/**
 * Like React.useState, but initial value is retrieved asynchronously
 * While value is being retrieved, hook returns undefined, which can be
 * conveniently replaced with a default value when destructuring the array
 *
 * @remarks
 * This hook resets the state value every time the prop changes. Thus,
 * you need to wrap the prop in React.useCallback(). This allows for
 * recalculation of the state when parent component props change.
 *
 * If async action is resolved after component destruction, no update occurs
 * (thus no warning messages are triggered)
 *
 * Rejected promises result in a modal error dialog
 *
 * @example
 * This would fetch data from a url, use defaultValue while fetching,
 * reFetch every time url changes, and allow to manually change state
 * value using setValue:
 * ```js
 * const [value=defaultValue, setValue] = useAsyncState(
 *   React.useCallback(()=>fetch(url), [url]);
 * );
 * ```
 */
export function useAsyncState<T>(
  callback: () => undefined | T | Promise<T | undefined>,
  // Show the loading screen while the promise is being resolved
  loadingScreen: boolean
): [
  state: T | undefined,
  setState: React.Dispatch<React.SetStateAction<T | undefined>>
] {
  const [state, setState] = React.useState<T | undefined>(undefined);
  const loading = React.useContext(LoadingContext);

  React.useEffect(() => {
    // If callback changes, state is reset while new state is fetching
    setState(undefined);
    const wrapped = loadingScreen ? loading : f.id;
    void wrapped(
      Promise.resolve(callback()).then((newState) =>
        destructorCalled ? undefined : setState(newState)
      )
    );

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [callback, loading, loadingScreen]);

  return [state, setState];
}

/**
 * A synchronous version of useAsyncState
 *
 * @remarks
 * Like React.useState, but default value must always be a function, and when
 * function changes, default value is recalculated and reapplied.
 *
 * Thus, wrap the callback in React.useCallback with dependency array that
 * would determine when the state is recalculated.
 *
 * @example
 * This will call getDefaultValue to get new default value every time
 * dependency changes
 * ```js
 * const [value, setValue] = useLiveState(
 *   React.useCallback(
 *     getDefaultValue,
 *     [dependency]
 *   )
 * );
 * ```
 */
export function useLiveState<T>(
  callback: () => T
): [state: T, setState: React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(() => callback());

  useReadyEffect(React.useCallback(() => setState(callback()), [callback]));

  return [state, setState];
}

/**
 * Like React.useState, but updates the state whenever default value changes
 */
export function useTriggerState<T>(
  defaultValue: T
): [state: T, setState: React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(defaultValue);

  /* Using layout effect rather than useEffect to update the state earlier on */
  React.useLayoutEffect(() => {
    setState(defaultValue);
  }, [defaultValue]);

  return [state, setState];
}

/**
 * Like React.useEffect, but does not execute on first render.
 * Passed callback must be wrapped in React.useCallback
 */
export function useReadyEffect(callback: () => void): void {
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) isFirstRender.current = false;
    else callback();
  }, [callback]);
}

export function useUnloadProtect(
  isEnabled: boolean,
  message: string
): () => void {
  const id = React.useRef({});
  React.useEffect(
    () =>
      isEnabled
        ? navigation.addUnloadProtect(id.current, message)
        : navigation.removeUnloadProtect(id.current),
    [isEnabled, message]
  );

  return React.useCallback(
    () => navigation.removeUnloadProtect(id.current),
    []
  );
}

/**
 * Many react states are simple boolean switches
 * This hook gives a convenient way to defined such states
 *
 * @example Usage
 * Without this hook:
 * ```js
 * const [isOpen, setIsOpen] = React.useState(false);
 * ```
 * With this hook:
 * ```
 * const [isOpen, handleOpen, handleClose, handleToggle] = useBooleanState();
 * ```
 * "handleOpen" is easier to reason about than "setIsOpen(false)"
 *
 * If handleClose or handleToggle actions are not needed, they simply
 * don't have to be destructured.
 *
 * Initial value can be given as a prop. State value is changed to match the
 * prop if prop changes.
 *
 * @example Performance optimization
 * This hook also reduces the render the need for reRenders
 * This calls reRender of Dialog on each parent component render since
 * lamda function is redefined at each render:
 * ```js
 * <Dialog onClose={():void => setIsOpen(false)} ... >...</Dialog>
 * ```
 * This doss not cause needless reRenders and looks cleaner:
 * ```js
 * <Dialog onClose={handleClose} ... >...</Dialog>
 * ```
 */
export function useBooleanState(
  value = false
): Readonly<
  [state: boolean, enable: () => void, disable: () => void, toggle: () => void]
> {
  const [state, setState] = useTriggerState(value);
  return [
    state,
    React.useCallback(
      function enable() {
        setState(true);
      },
      [setState]
    ),
    React.useCallback(
      function disable() {
        setState(false);
      },
      [setState]
    ),
    React.useCallback(
      function toggle() {
        setState((value) => !value);
      },
      [setState]
    ),
  ];
}

/**
 * A hook to integrate an Input with a field on a Backbone resource
 *
 * @remarks
 * If Backbone field value changes, hook is updated
 *
 * Field schema is used to define a Parser than can be used to get
 * validation attributes for an Input
 *
 * If field value is invalid, save blocker is set. It is cleared as soon
 * as field value is corrected
 *
 */
export function useResourceValue<
  T extends string | number | boolean,
  INPUT extends Input = HTMLInputElement
>(
  resource: SpecifyResource<AnySchema>,
  // If fieldName is undefined, this behaves pretty much like useValidation()
  fieldName: string | undefined,
  defaultParser: Parser | undefined,
  validationMessage?: string | RA<string>
): {
  readonly value: T | undefined;
  readonly updateValue: (newValue: T) => void;
  // See useValidation for documentation of these props:
  readonly validationRef: React.RefCallback<INPUT>;
  readonly inputRef: React.MutableRefObject<INPUT | null>;
  readonly setValidation: (message: string | RA<string>) => void;
  readonly parser: Parser;
} & ReturnType<typeof useValidation> {
  const { inputRef, validationRef, setValidation } =
    useValidation<INPUT>(validationMessage);

  const [parser, setParser] = React.useState<Parser>({});

  const [value, setValue] = React.useState<T | undefined>(undefined);

  const [{ triedToSubmit }] = React.useContext(FormContext);

  /*
   * Display saveBlocker validation errors only after field lost focus, not
   * during typing
   */
  const [input, setInput] = React.useState<INPUT | null>(null);
  const blockers = React.useRef<RA<string>>([]);
  const handleBlur = React.useCallback(
    (): void =>
      blockers.current.length > 0 ? setValidation(blockers.current) : undefined,
    [setValidation]
  );
  React.useEffect(() => {
    if (typeof fieldName === 'undefined') return undefined;

    function handleChange(): void {
      if (typeof fieldName === 'undefined') return undefined;
      blockers.current = resource.saveBlockers
        .blockersForField(fieldName)
        .filter(({ deferred }) => !deferred || triedToSubmit)
        .map(({ reason }) => reason);
      // Report validity only if not focused
      if (document.activeElement !== inputRef.current) handleBlur();
    }

    resource.on('blockerschanged', handleChange);
    return (): void => resource.off('blockerschanged', handleChange);
  }, [triedToSubmit, resource, fieldName, handleBlur]);
  React.useEffect(() => {
    if (input === null || typeof fieldName === 'undefined') return undefined;
    input.addEventListener('blur', handleBlur);
    return (): void => input.removeEventListener('blur', handleBlur);
  }, [input, setValidation, fieldName, handleBlur]);

  // Parse value and update saveBlockers
  const updateValue = React.useCallback(
    function updateValue(newValue: T) {
      /*
       * Converting ref to state so that React.useEffect can be triggered
       * when needed
       */
      setInput(inputRef.current);

      setValue(
        (typeof parser?.type === 'number'
          ? f.parseInt(parser?.printFormatter?.(newValue, parser) ?? '') ??
            newValue
          : newValue) as T
      );
      if (typeof fieldName === 'undefined') return;

      const parseResults = parseValue(
        parser,
        inputRef.current ?? undefined,
        newValue?.toString() ?? ''
      );
      const key = `parseError:${fieldName.toLowerCase()}`;
      if (parseResults.isValid) {
        resource.saveBlockers?.remove(key);
        if (inputRef.current?.validity.valid === false) return;
        const oldValue = resource.get(fieldName) ?? null;
        const parsedValue = parseResults.parsed as string;
        // Don't trigger unload protect needlessly
        if (oldValue !== parsedValue)
          resource.set(fieldName, parsedValue as never);
      } else {
        setValidation(parseResults.reason);
        resource.saveBlockers?.add(key, fieldName, parseResults.reason);
      }
    },
    [resource, fieldName, parser, inputRef, setValidation]
  );

  /*
   * Show errors if default parser changes (to catch possible performance issues)
   */
  const previousParser = React.useRef<Parser | undefined | false>(false);
  React.useEffect(() => {
    if (
      previousParser.current !== false &&
      previousParser.current !== defaultParser
    )
      console.error('Default parser changed. Use React.useMemo()');
    return (): void => {
      previousParser.current = defaultParser;
    };
  }, [defaultParser]);

  // Listen for resource update. Set parser. Set default value
  React.useEffect(() => {
    if (typeof fieldName === 'undefined') return undefined;

    const field = resource.specifyModel.getField(fieldName);
    if (typeof field === 'undefined')
      console.error(
        `${fieldName} does not exist on ${resource.specifyModel.name}`,
        { resource }
      );

    /*
     * Disable parser when validation is disabled. This is useful in search
     * dialogs where space and quote characters are interpreted differently,
     * thus validation for them should be disabled.
     */
    const parser =
      resource.noValidation === true || typeof field === 'undefined'
        ? {}
        : resolveParser(field) ?? {};
    setParser(parser);

    resource.settingDefaultValues(() =>
      typeof defaultParser?.value === 'undefined' || !resource.isNew()
        ? undefined
        : resource.set(
            fieldName,
            (defaultParser.value.toString().toLowerCase() === 'today'
              ? parser.type === 'date'
                ? getDateInputValue(new Date())
                : defaultParser.value
              : defaultParser.value) as never
          )
    );

    const refresh = (): void =>
      setValue((resource.get(fieldName) as T | null) ?? undefined);

    resource.on(`change:${fieldName}`, refresh);
    refresh();
    return (): void => resource.off(`change:${fieldName}`, refresh);
  }, [resource, fieldName, defaultParser]);

  return {
    value,
    updateValue,
    inputRef,
    validationRef,
    setValidation,
    parser,
  } as const;
}

export function useIsModified(
  resource: SpecifyResource<AnySchema> | undefined
): boolean {
  const [saveRequired, handleNeedsSaving, handleSaved] = useBooleanState(
    resource?.needsSaved
  );

  React.useEffect(() => {
    resource?.on('saverequired fakesaverequired', handleNeedsSaving);
    resource?.on('saved fakesaved', handleSaved);
    return (): void => {
      resource?.off('saverequired fakesaverequired', handleNeedsSaving);
      resource?.off('saved fakesaved', handleSaved);
    };
  }, [resource, handleNeedsSaving, handleSaved]);

  return saveRequired;
}
