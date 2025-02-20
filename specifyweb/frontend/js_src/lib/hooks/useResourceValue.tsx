import React from 'react';

import type { AnySchema } from '../components/DataModel/helperTypes';
import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import { resourceOn } from '../components/DataModel/resource';
import { getFieldBlockerKey } from '../components/DataModel/saveBlockers';
import type {
  LiteralField,
  Relationship,
} from '../components/DataModel/specifyField';
import type { Input } from '../components/Forms/validationHelpers';
import type { Parser } from '../utils/parser/definitions';
import type { RA } from '../utils/types';
import { useParser } from './resource';
import { useFieldDefaultValue } from './useFieldDefaultValue';
import { useFieldParser } from './useFieldParser';
import { useFieldValidation } from './useFieldValidation';

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
  INPUT extends Input = Input,
>(
  resource: SpecifyResource<AnySchema> | undefined,
  // If field is undefined, this hook behaves pretty much like useValidation()
  field: LiteralField | Relationship | undefined,
  // Default parser is usually coming from the form definition
  defaultParser: Parser | undefined,
  trim?: boolean
): {
  readonly value: T | undefined;
  readonly updateValue: (newValue: T, reportErrors?: boolean) => void;
  // See useValidation for documentation of these props:
  readonly validationRef: React.RefCallback<INPUT>;
  readonly inputRef: React.MutableRefObject<INPUT | null>;
  readonly setValidation: (message: RA<string> | string) => void;
  readonly parser: Parser;
} {
  const parser = useParser(field, resource, defaultParser);

  useFieldDefaultValue(resource, field, parser);

  const { inputRef, validationRef, setValidation } = useFieldValidation<INPUT>(
    resource,
    field
  );

  const [value, updateValue] = useFieldParser<T, INPUT>({
    resource,
    field,
    inputRef,
    parser,
    trim,
    onParse: (parseResult) => {
      if (field === undefined) return;

      if (parseResult.isValid)
        setValidation([], getFieldBlockerKey(field, 'parseResult'));
      else
        setValidation(
          [parseResult.reason],
          getFieldBlockerKey(field, 'parseResult')
        );
    },
  });

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
    setValidation,
    parser,
  } as const;
}
