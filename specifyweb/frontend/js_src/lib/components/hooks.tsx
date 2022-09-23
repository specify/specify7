/**
 * Definitions for React hooks that are used extensively throughout the
 * application
 */

import React from 'react';

import { tap } from '../assert';
import type { AnySchema } from '../datamodelutils';
import { getDateInputValue } from '../dayjs';
import { listen } from '../events';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { parseRelativeDate } from '../relativedate';
import { resourceOn } from '../resource';
import type { Input } from '../saveblockers';
import type { R, RA } from '../types';
import type { Parser } from '../uiparse';
import { mergeParsers, parseValue, resolveParser } from '../uiparse';
import { isInputTouched } from '../validationmessages';
import { className } from './basic';
import { FormContext, LoadingContext } from './contexts';

const idStore: R<number> = {};

/**
 * A hook that returns a unique string ID generator that is unique
 * and unchanging for the lifecycle of a component
 *
 * @remarks
 * No matter which prefix is chosen, the final ID is guaranteed to be unique
 * among all components. Thus, you shouldn't worry about prefixes being globally
 * unique. The specific prefix does not matter at all, except it makes debugging
 * easier.
 *
 * Update:
 * React 18 added a useId hook that serves a similar purpose. However, there
 * are some advantages to using this useId implementation:
 *   - Generated IDs use a human-readable prefix, rather than `:r0:` to make
 *     debugging easier. React's implementation is better at avoiding conflicts,
 *     but it shouldn't be a problem since IDs are not widely used in Specify 7,
 *     other than for accessibility in forms.
 *   - React.useId generates only one ID, where as it is common to need several
 *     IDs at once. While you could use that ID and manually concat different
 *     suffixes, this useId implementation returns a suffix-awere function to
 *     begin with. If you don't need a suffix, then just call this hook like this:
 *     ```js
 *     const id = useId('somePrefix')('');
 *     ```
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
  window.document.title = commonText('appTitle', title);
}

const titleStack = new Map<unknown, string>();

const refreshTitle = (): void =>
  setTitle(Array.from(titleStack.values()).slice(-1)[0] ?? '');

/** Set title of the webpage. Restores previous title on component destruction */
export function useTitle(title: string | undefined): void {
  // Change page's title
  React.useEffect(() => {
    const id = {};
    if (typeof title === 'string') titleStack.set(id, title);
    refreshTitle();
    return (): void => {
      titleStack.delete(id);
      refreshTitle();
    };
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
  readonly setValidation: (
    message: string | RA<string>,
    type?: 'focus' | 'auto' | 'silent'
  ) => void;
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
  const isFirstError = React.useRef(validationMessageRef.current !== '');

  // Clear validation message on typing
  React.useEffect(() => {
    if (!inputRef.current) return undefined;
    const input = inputRef.current;

    return listen(input, 'input', (): void => {
      if (input.validity.customError) {
        validationMessageRef.current = '';
        input.setCustomValidity('');
      }
    });
  }, []);

  // Display validation message on focus
  const isFirstFocus = React.useRef<boolean>(true);
  React.useEffect(() => {
    if (!inputRef.current) return undefined;
    const input = inputRef.current;

    return listen(input, 'focus', (): void => {
      if (isFirstFocus.current) isFirstFocus.current = false;
      else input.reportValidity();
    });
  }, []);

  const setValidation = React.useCallback(function setValidation(
    message: string | RA<string>,
    type: 'focus' | 'auto' | 'silent' = 'auto'
  ): void {
    const joined = Array.isArray(message) ? message.join('\n') : message;
    if (validationMessageRef.current === joined && type !== 'focus') return;

    validationMessageRef.current = joined;
    const input = inputRef.current;
    if (!input) return;
    // Empty string clears validation error
    input.setCustomValidity(joined);

    if (joined !== '' && isInputTouched(input) && type !== 'silent')
      input.reportValidity();
    else if (isFirstError.current) {
      isFirstError.current = false;
      input.reportValidity();
    }
  },
  []);

  React.useEffect(() => setValidation(message), [message, setValidation]);

  return {
    inputRef,
    validationRef: React.useCallback(
      (input): void => {
        inputRef.current = input;
        setValidation(validationMessageRef.current, 'focus');
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
 * Like React.useMemo, but with setState
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
  T extends string | number | boolean | null,
  INPUT extends Input = HTMLInputElement
>(
  resource: SpecifyResource<AnySchema>,
  // If fieldName is undefined, this hook behaves pretty much like useValidation()
  fieldName: string | undefined,
  // Default parser is usually coming from the form definition
  defaultParser: Parser | undefined
): {
  readonly value: T | undefined;
  readonly updateValue: (newValue: T, reportError?: boolean) => void;
  // See useValidation for documentation of these props:
  readonly validationRef: React.RefCallback<INPUT>;
  readonly inputRef: React.MutableRefObject<INPUT | null>;
  readonly setValidation: (message: string | RA<string>) => void;
  readonly parser: Parser;
} & ReturnType<typeof useValidation> {
  const { inputRef, validationRef, setValidation } = useValidation<INPUT>();

  const [parser, setParser] = React.useState<Parser>({});

  const [value, setValue] = React.useState<T | undefined>(undefined);

  const field = React.useMemo(() => {
    if (typeof fieldName === 'string') {
      const field = resource.specifyModel.getField(fieldName);
      if (field === undefined)
        console.error(
          `${fieldName} does not exist on ${resource.specifyModel.name}`,
          { resource }
        );
      return field;
    } else return undefined;
  }, [fieldName, resource]);


  const [{ triedToSubmit }] = React.useContext(FormContext);

  /*
   * Display saveBlocker validation errors only after field lost focus, not
   * during typing
   */
  const [input, setInput] = React.useState<INPUT | null>(null);
  const blockers = React.useRef<RA<string>>([]);
  const [ignoreError, handleIgnoreError, handleDontIgnoreError] =
    useBooleanState();
  React.useEffect(() => {
    if (typeof field === 'undefined') return;
    const getBlockers = (): RA<string> =>
      resource.saveBlockers
        ?.blockersForField(field.name)
        .filter(({ deferred }) => !deferred || triedToSubmit)
        .map(({ reason }) => reason) ?? [];
    blockers.current = getBlockers();
    resourceOn(resource, 'blockersChanged', (): void => {
      if (typeof field === 'undefined') return;
      blockers.current = getBlockers();
      handleDontIgnoreError();
      // Report validity only if not focused
      if (document.activeElement !== inputRef.current)
        setValidation(blockers.current);
    });
  }, [
    triedToSubmit,
    resource,
    field,
    setValidation,
    inputRef,
    handleDontIgnoreError,
  ]);
  React.useEffect(
    () =>
      input === null || typeof field === 'undefined'
        ? undefined
        : listen(input, 'blur', (): void => {
            // Don't report the same error twice
            if (ignoreError) return;
            setValidation(blockers.current);
            handleIgnoreError();
          }),
    [input, setValidation, field, ignoreError, handleIgnoreError]
  );

  /*
   * Updating field value changes data model value, which triggers a field
   * update, which updated field value, and so on. This ref helps break
   * this cycle.
   */
  const ignoreChangeRef = React.useRef(false);

  // Parse value and update saveBlockers
  const updateValue = React.useCallback(
    /*
     * TODO: disable @typescript-eslint/no-inferrable-types and set
     *   type explicitly as @typescript-eslint/strict-boolean-expressions can't
     *   infer implicit types
     */
    function updateValue(newValue: T, reportErrors = true) {
      if (ignoreChangeRef.current) return;

      /*
       * Converting ref to state so that React.useEffect can be triggered
       * when needed
       */
      setInput(inputRef.current);

      if (typeof parser.type === 'undefined') return;

      /*
       * If updateValue is called from the onChange event handler and field is
       * required and field did not have a value when onChange occurred, then
       * parseValue() is going to report "Value missing" error. This fixes that
       * issue. See https://github.com/specify/specify7/issues/1427
       */
      if (
        inputRef.current !== null &&
        inputRef.current.value === '' &&
        newValue !== ''
      )
        inputRef.current.value = newValue?.toString() ?? inputRef.current.value;

      const parseResults = parseValue(
        parser,
        inputRef.current ?? undefined,
        newValue?.toString() ?? ''
      );

      const parsedValue = parseResults.isValid ? parseResults.parsed : newValue;
      const formattedValue =
        field?.isRelationship === true && newValue === ''
          ? null
          : ['checkbox', 'date'].includes(parser.type ?? '') || reportErrors
          ? parsedValue
          : newValue;
      setValue(
        (parser.type === 'number' && reportErrors
          ? f.parseFloat(parser?.printFormatter?.(parsedValue, parser) ?? '') ??
            parsedValue
          : formattedValue) as T
      );
      if (typeof field === 'undefined') return;
      const key = `parseError:${field.name.toLowerCase()}`;
      if (parseResults.isValid) resource.saveBlockers?.remove(key);
      else resource.saveBlockers?.add(key, field.name, parseResults.reason);
      setValidation(blockers.current, reportErrors ? 'auto' : 'silent');
      ignoreChangeRef.current = true;
      /*
       * If value changed as a result of being formatted, don't trigger
       * unload protect
       */
      const formattedOnly = resource.get(field.name) === newValue;
      resource.set(field.name, formattedValue as never, {
        /*
         * Don't trigger the save blocker for this trivial change
         * TODO: move this logic into ResourceBase.set
         */
        silent:
          (formattedValue === null && resource.get(field.name) === '') ||
          formattedOnly,
      });
      ignoreChangeRef.current = false;
    },
    [resource, field, parser, inputRef, setValidation]
  );

  /*
   * Resource changes when sliding in a record selector, but react reuses
   * the DOM component, thus need to manually add back the "notTouchedInput"
   * class name
   */
  React.useEffect(
    () => input?.classList.add(className.notTouchedInput),
    [input, resource]
  );

  // Listen for resource update. Set parser. Set default value
  React.useEffect(() => {
    if (typeof field === 'undefined') return;

    /*
     * Disable parser when validation is disabled. This is useful in search
     * dialogs where space and quote characters are interpreted differently,
     * thus validation for them should be disabled.
     */
    const shouldResolveParser =
      resource.noValidation !== true && typeof field === 'object';
    const resolvedParser = shouldResolveParser
      ? resolveParser(field)
      : { type: 'text' as const };
    const parser = shouldResolveParser
      ? typeof defaultParser === 'object'
        ? mergeParsers(resolvedParser, defaultParser)
        : resolvedParser
      : resolvedParser;
    setParser(parser);

    if (
      typeof parser.value !== 'undefined' &&
      /*
       * Even if resource is new, some values may be prepopulated (i.e, by
       * PrepDialog). This is a crude check to see if form's default value
       * should overwrite that of the resource
       */
      resource.isNew() &&
      (parser.type !== 'number' ||
        typeof resource.get(field.name) !== 'number' ||
        resource.get(field.name) === 0) &&
      ((parser.type !== 'text' && parser.type !== 'date') ||
        typeof resource.get(field.name) !== 'string' ||
        resource.get(field.name) === '') &&
      parser.type !== 'checkbox' &&
      resource.get(field.name) !== true &&
      /*
       * Don't auto set numeric fields to "0", unless it is the default value
       * in the form definition
       */
      (parser.type !== 'number' ||
        resolvedParser.value !== 0 ||
        (defaultParser?.value ?? 0) !== 0)
    )
      resource.set(
        field.name,
        (parser.type === 'date'
          ? getDateInputValue(
              parseRelativeDate(
                parser.value?.toString().trim().toLowerCase() ?? ''
              ) ?? new Date()
            )
          : parser.value) as never,
        { silent: true }
      );
  }, [resource, field, defaultParser]);

  React.useEffect(
    () =>
      typeof field === 'object'
        ? resourceOn(
            resource,
            `change:${field.name}`,
            (): void => updateValue(resource.get(field.name) as T),
            true
          )
        : undefined,
    [field, updateValue, resource, parser]
  );

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
  resource: SpecifyResource<AnySchema> | undefined,
  // Whether a new resource that hasn't been modified is treated as not modified
  ignoreBrandNew = true
): boolean {
  const [saveRequired, handleNeedsSaving, handleSaved] = useBooleanState(
    resource?.needsSaved === true && (!resource?.isNew() || !ignoreBrandNew)
  );

  React.useEffect(
    () =>
      typeof resource === 'object'
        ? resourceOn(resource, 'saveRequired', tap(handleNeedsSaving))
        : undefined,
    [resource, handleNeedsSaving]
  );

  React.useEffect(
    () =>
      typeof resource === 'object'
        ? resourceOn(resource, 'saved', handleSaved)
        : undefined,
    [resource, handleSaved]
  );

  return saveRequired;
}
