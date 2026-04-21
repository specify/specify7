import React from 'react';

import type { AnySchema } from '../components/DataModel/helperTypes';
import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import type {
  LiteralField,
  Relationship,
} from '../components/DataModel/specifyField';
import { getDateInputValue } from '../utils/dayJs';
import type { Parser } from '../utils/parser/definitions';
import { parseAnyDate } from '../utils/relativeDate';

/**
 * Handles setting the default value of a field if needed on a resource
 * according to some parser.
 *
 * If you don't have a parser, you can use `resolveParser` or `useParser` to
 * generate one given the field and resource
 *
 * Example:
 * ```
 * const parser = useParser(field, resource);
 * useParserDefaultValue(resource, field, parser);
 * ```
 *
 */
export function useParserDefaultValue(
  resource: SpecifyResource<AnySchema> | undefined,
  field: LiteralField | Relationship | undefined,
  parser: Parser
) {
  React.useLayoutEffect(() => {
    if (field === undefined || resource === undefined) return;
    /*
     * Don't auto set numeric to "0" or boolean fields to false, unless it is the default value
     * in the form definition
     */
    // REFACTOR: resolveParser() should probably not make up the default value like false/0 out of the blue as it's not safe to assume that it's always desired (vs null)
    const hasDefault =
      parser.value !== undefined &&
      (parser.type !== 'number' || parser.value !== 0) &&
      (parser.type !== 'checkbox' || parser.value !== false);

    const fieldValue = resource.get(field.name) as
      | boolean
      | number
      | string
      | null
      | undefined;

    if (
      hasDefault &&
      /*
       * Even if resource is new, some values may be prepopulated (i.e, by
       * PrepDialog). This is a crude check to see if form's default value
       * should overwrite that of the resource
       */
      resource.isNew() &&
      (parser.type !== 'number' ||
        typeof fieldValue !== 'number' ||
        fieldValue === 0) &&
      ((parser.type !== 'text' && parser.type !== 'date') ||
        typeof fieldValue !== 'string' ||
        fieldValue === '') &&
      (parser.type !== 'checkbox' || typeof fieldValue !== 'boolean')
    )
      resource.set(
        field.name,
        (parser.type === 'date'
          ? (getDateInputValue(
              parseAnyDate(parser.value?.toString() ?? '') ?? new Date()
            ) ?? new Date())
          : parser.value) as never,
        { silent: true }
      );
  }, [parser, resource, field]);
}
