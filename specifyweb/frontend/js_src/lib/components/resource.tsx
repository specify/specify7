import React from 'react';

import type { Tables } from '../datamodel';
import type { AnySchema, SerializedResource } from '../datamodelutils';
import { serializeResource } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { getModel } from '../schema';
import type { LiteralField, Relationship } from '../specifyfield';
import type { IR } from '../types';
import { defined } from '../types';
import { getValidationAttributes, resolveParser } from '../uiparse';

/**
 * A wrapper for Backbone.Resource that integrates with React.useState for
 * easier state tracking
 *
 * @example Can detect field changes using React hooks:
 *   React.useEffect(()=>{}, [model]);
 * @example Or only certain fields:
 *   React.useEffect(()=>{}, [model.name, model.fullname]);
 */
export function useResource<SCHEMA extends AnySchema>(
  model: SpecifyResource<SCHEMA>
): readonly [
  SerializedResource<SCHEMA>,
  (
    newState:
      | SerializedResource<SCHEMA>
      | ((
          previousState: SerializedResource<SCHEMA>
        ) => SerializedResource<SCHEMA>)
  ) => void
] {
  const [resource, setResource] = React.useState<SerializedResource<SCHEMA>>(
    () => serializeResource(model)
  );

  const previousResourceRef =
    React.useRef<SerializedResource<SCHEMA>>(resource);
  React.useEffect(() => {
    const changes = Object.entries(resource).filter(
      ([key, newValue]) =>
        (newValue as unknown) !== previousResourceRef.current[key]
    );
    if (changes.length === 0) return;

    changes.forEach(([key, newValue]) =>
      model.set(key as 'resource_uri', newValue as never)
    );
    previousResourceRef.current = resource;
  }, [resource, model]);

  return [resource, setResource];
}

/** Hook for getting save blockers for a model's field */
export function useSaveBlockers({
  model,
  fieldName,
}: {
  readonly model: SpecifyResource<AnySchema>;
  readonly fieldName: string;
}): string {
  const [errors, setErrors] = React.useState<string>('');
  React.useEffect(() => {
    model.on('blockerschanged', () =>
      setErrors(model.saveBlockers.getFieldErrors(fieldName).join('\n'))
    );
  }, [model, fieldName]);
  return errors;
}

export function useValidationAttributes(
  field: LiteralField | Relationship
): IR<string> {
  const [attributes, setAttributes] = React.useState<IR<string>>({});
  React.useEffect(() => {
    const parser = defined(resolveParser(field));
    setAttributes(getValidationAttributes(parser));
  }, [field]);
  return attributes;
}

export function parseResourceUrl(
  resourceUrl: string
): Readonly<[modelName: keyof Tables, id: number] | undefined> {
  const parsed = /^\/api\/specify\/(\w+)\/(?:(\d+)\/)?$/
    .exec(resourceUrl)
    ?.slice(1);
  return typeof parsed === 'undefined'
    ? parsed
    : [parsed[0] as keyof Tables, Number.parseInt(parsed[1])];
}

export function resourceFromUri(
  resourceUrl: string,
  options = { noBusinessRules: false }
): SpecifyResource<AnySchema> | undefined {
  const parsed = parseResourceUrl(resourceUrl);
  if (typeof parsed === 'undefined') return undefined;
  const [tableName, id] = parsed;
  return new (defined(getModel(tableName)).Resource)({ id }, options);
}
