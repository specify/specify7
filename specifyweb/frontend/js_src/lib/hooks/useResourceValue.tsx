import React from 'react';

import { className } from '../components/Atoms/className';
import type { AnySchema } from '../components/DataModel/helperTypes';
import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import { resourceOn } from '../components/DataModel/resource';
import {
  getFieldBlockerKey,
  useSaveBlockers,
} from '../components/DataModel/saveBlockers';
import type {
  LiteralField,
  Relationship,
} from '../components/DataModel/specifyField';
import type { Input } from '../components/Forms/validationHelpers';
import { getDateInputValue } from '../utils/dayJs';
import { f } from '../utils/functools';
import type { Parser } from '../utils/parser/definitions';
import { parseValue } from '../utils/parser/parse';
import { parseAnyDate } from '../utils/relativeDate';
import type { RA } from '../utils/types';
import { useParser } from './resource';
import { useValidation } from './useValidation';

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
 * Takes care of attaching error message to field (useValidation)
 *
 * Sets the default value if needed
 *
 *
 * TEST: add tests for this hook
 * REFACTOR: consider breaking this hook into smaller hooks
 *
 */
export function useResourceValue<
  T extends boolean | number | string | null,
  INPUT extends Input = HTMLInputElement
>(
  resource: SpecifyResource<AnySchema> | undefined,
  // If field is undefined, this hook behaves pretty much like useValidation()
  field: LiteralField | Relationship | undefined,
  // Default parser is usually coming from the form definition
  defaultParser: Parser | undefined,
  trim?: boolean
): ReturnType<typeof useValidation> & {
  readonly value: T | undefined;
  readonly updateValue: (newValue: T, reportErrors?: boolean) => void;
  // See useValidation for documentation of these props:
  readonly validationRef: React.RefCallback<INPUT>;
  readonly inputRef: React.MutableRefObject<INPUT | null>;
  readonly setValidation: (message: RA<string> | string) => void;
  readonly parser: Parser;
} {
  const parser = useParser(field, resource, defaultParser);

  const [value, setValue] = React.useState<T | undefined>(undefined);

  /*
   * Display saveBlocker validation errors only after field lost focus, not
   * during typing
   */
  const [input, setInput] = React.useState<INPUT | null>(null);
  const [blockers, setBlockers] = useSaveBlockers(resource, field);
  const { inputRef, validationRef, setValidation } =
    useValidation<INPUT>(blockers);

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
    (newValue: T, reportErrors = true) => {
      if (ignoreChangeRef.current || resource === undefined) return;

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
        newValue?.toString() ?? '',
        trim
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

      if (parseResults.isValid)
        setBlockers([], getFieldBlockerKey(field, 'parseResult'));
      else
        setBlockers(
          [parseResults.reason],
          getFieldBlockerKey(field, 'parseResult')
        );

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

  // Set default value
  React.useLayoutEffect(() => {
    if (field === undefined || resource === undefined) return;

    /*
     * Don't auto set numeric to "0" or boolean fields to false, unless it is the default value
     * in the form definition
     */
    // REFACTOR: resolveParser() should probably not make up the default value like false/0 out of the blue as it's not safe to assume that it's always desired (vs null)
    const hasDefault =
      parser.value !== undefined &&
      (parser.type !== 'number' ||
        parser.value !== 0 ||
        defaultParser?.value === 0) &&
      (parser.type !== 'checkbox' ||
        parser.value !== false ||
        defaultParser?.value === false);

    const fieldValue = resource.get(field.name) as
      | boolean
      | number
      | string
      | null
      | undefined;
    const parsedValue = parseValue(
      parser,
      inputRef.current ?? undefined,
      fieldValue?.toString() ?? '',
      trim
    );
    if (
      hasDefault &&
      /*
       * Even if resource is new, some values may be prepopulated (i.e, by
       * PrepDialog). This is a crude check to see if form's default value
       * should overwrite that of the resource
       */
      resource.isNew() &&
      (!parsedValue.isValid ||
        ((parser.type !== 'number' ||
          typeof fieldValue !== 'number' ||
          fieldValue === 0) &&
          ((parser.type !== 'text' && parser.type !== 'date') ||
            typeof fieldValue !== 'string' ||
            fieldValue === '') &&
          (parser.type !== 'checkbox' || typeof fieldValue !== 'boolean')))
    )
      resource.set(
        field.name,
        (parser.type === 'date'
          ? getDateInputValue(
              parseAnyDate(parser.value?.toString() ?? '') ?? new Date()
            ) ?? new Date()
          : parser.value) as never,
        { silent: true }
      );
  }, [parser, resource, field, defaultParser]);

  // Listen for resource update
  React.useLayoutEffect(
    () =>
      typeof field === 'object' && typeof resource === 'object'
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
    setValidation: React.useCallback(
      (message) => {
        const blockers = typeof message === 'string' ? [message] : message;
        if (field !== undefined)
          setBlockers(blockers, getFieldBlockerKey(field, 'validation'));
      },
      [setBlockers, field]
    ),
    parser,
  } as const;
}
