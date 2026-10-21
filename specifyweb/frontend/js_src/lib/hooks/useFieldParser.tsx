import React from 'react';

import { className } from '../components/Atoms/className';
import type { AnySchema } from '../components/DataModel/helperTypes';
import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import type {
  LiteralField,
  Relationship,
} from '../components/DataModel/specifyField';
import type { Input } from '../components/Forms/validationHelpers';
import { f } from '../utils/functools';
import type { Parser } from '../utils/parser/definitions';
import type {
  InvalidParseResult,
  ValidParseResult,
} from '../utils/parser/parse';
import { parseValue } from '../utils/parser/parse';

export function useFieldParser<
  T extends boolean | number | string | null,
  INPUT extends Input = HTMLInputElement,
>({
  resource,
  field,
  inputRef,
  parser,
  trim,
  onParse: handleParse,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly field: LiteralField | Relationship | undefined;
  readonly inputRef: React.MutableRefObject<INPUT | null>;
  readonly parser: Parser;
  readonly trim?: boolean;
  readonly onParse: (
    parseResult: InvalidParseResult | ValidParseResult
  ) => void;
}): readonly [
  value: T | undefined,
  updateValue: (newValue: T, reportErrors?: boolean) => void,
] {
  /*
   * Display saveBlocker validation errors only after field lost focus, not
   * during typing
   */
  const [input, setInput] = React.useState<INPUT | null>(null);
  const [value, setValue] = React.useState<T | undefined>(undefined);

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
          ? (f.parseFloat(
              parser?.printFormatter?.(parsedValue, parser) ?? ''
            ) ?? parsedValue)
          : formattedValue) as T
      );
      if (field === undefined) return;
      handleParse(parseResults);

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
    [resource, field, parser, inputRef]
  );

  // REFACTOR: move this?
  /*
   * Resource changes when sliding in a record selector, but react reuses
   * the DOM component, thus need to manually add back the "notTouchedInput"
   * class name
   */
  React.useEffect(
    () => input?.classList.add(className.notTouchedInput),
    [input, resource]
  );

  return [value, updateValue] as const;
}
