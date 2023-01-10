import React from 'react';

import { className } from '../components/Atoms/className';
import type { AnySchema } from '../components/DataModel/helperTypes';
import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import { resourceOn } from '../components/DataModel/resource';
import type { Input } from '../components/DataModel/saveBlockers';
import type {
  LiteralField,
  Relationship,
} from '../components/DataModel/specifyField';
import { FormContext } from '../components/Forms/BaseResourceView';
import { getDateInputValue } from '../utils/dayJs';
import { listen } from '../utils/events';
import { f } from '../utils/functools';
import type { Parser } from '../utils/parser/definitions';
import { mergeParsers, resolveParser } from '../utils/parser/definitions';
import { parseValue } from '../utils/parser/parse';
import { parseRelativeDate } from '../utils/relativeDate';
import type { RA } from '../utils/types';
import { useBooleanState } from './useBooleanState';
import { useValidation } from './useValidation';
import { FormContext } from '../components/Forms/BaseResourceView';

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
 * TEST: add tests for this hook
 * REFACTOR: consider breaking this hook into smaller hooks
 *
 */
export function useResourceValue<
  T extends boolean | number | string | null,
  INPUT extends Input = HTMLInputElement
>(
  resource: SpecifyResource<AnySchema>,
  // If field is undefined, this hook behaves pretty much like useValidation()
  field: LiteralField | Relationship | undefined,
  // Default parser is usually coming from the form definition
  defaultParser: Parser | undefined
): ReturnType<typeof useValidation> & {
  readonly value: T | undefined;
  readonly updateValue: (newValue: T, reportError?: boolean) => void;
  // See useValidation for documentation of these props:
  readonly validationRef: React.RefCallback<INPUT>;
  readonly inputRef: React.MutableRefObject<INPUT | null>;
  readonly setValidation: (message: RA<string> | string) => void;
  readonly parser: Parser;
} {
  const { inputRef, validationRef, setValidation } = useValidation<INPUT>();

  const [parser, setParser] = React.useState<Parser>({});

  const [value, setValue] = React.useState<T | undefined>(undefined);

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
    if (field === undefined) return;
    const getBlockers = (): RA<string> =>
      resource.saveBlockers
        ?.blockersForField(field.name)
        .filter(({ deferred }) => !deferred || triedToSubmit)
        .map(({ reason }) => reason) ?? [];
    blockers.current = getBlockers();
    resourceOn(
      resource,
      'blockersChanged',
      (): void => {
        if (field === undefined) return;
        blockers.current = getBlockers();
        handleDontIgnoreError();
        // Report validity only if not focused
        if (document.activeElement !== inputRef.current)
          setValidation(blockers.current);
      },
      false
    );
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
      input === null || field === undefined
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
     * REFACTOR: disable @typescript-eslint/no-inferrable-types and set
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

      if (parser.type === undefined) return;

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
      if (field === undefined) return;
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
         * REFACTOR: move this logic into ResourceBase.set
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
    if (field === undefined) return;

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
      parser.value !== undefined &&
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
            ) ?? new Date()
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
