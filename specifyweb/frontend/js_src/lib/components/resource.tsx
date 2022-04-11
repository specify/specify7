import React from 'react';

import type {
  AnySchema,
  SerializedModel,
  SerializedResource,
} from '../datamodelutils';
import { serializeResource } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { parseResourceUrl } from '../resource';
import { schema } from '../schema';
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

export const deserializeResource = <SCHEMA extends AnySchema>(
  resource: SerializedResource<SCHEMA> | SerializedModel<SCHEMA>
): SpecifyResource<SCHEMA> =>
  new schema.models[
    /**
     * This assertion, while not required by TypeScript, is needed to fix
     * a typechecking performance issue (it was taking 5s to typecheck this
     * line according to TypeScript trace analyzer)
     */
    defined(
      parseResourceUrl(resource.resource_uri?.toString() ?? '')
    )[0] as SCHEMA['tableName']
  ].Resource(resource);

/** Hook for getting save blockers for a model's field */
export function useSaveBlockers({
  resource,
  fieldName,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly fieldName: string;
}): string {
  const [errors, setErrors] = React.useState<string>('');
  React.useEffect(() => {
    const handleChange = (): void =>
      setErrors(resource.saveBlockers.getFieldErrors(fieldName).join('\n'));
    resource.on('blockerschanged', handleChange);
    return (): void => resource.off('blockerschanged', handleChange);
  }, [resource, fieldName]);
  return errors;
}

/**
 * Derive validation attributes for an <Input> from a field schema
 *
 */
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

export async function getResourceAndField(
  model: SpecifyResource<AnySchema>,
  fieldName: string | undefined
): Promise<
  | {
      readonly resource: SpecifyResource<AnySchema>;
      readonly field: LiteralField | Relationship;
    }
  | undefined
> {
  const path = fieldName?.split('.') ?? [];
  const getResource =
    path.length === 0
      ? Promise.resolve(undefined)
      : path.length == 1
      ? model.fetch()
      : model.rgetPromise(path.slice(0, -1).join('.'));

  return getResource.then((resource) => {
    const field = model.specifyModel.getField(fieldName ?? '');
    if (typeof field === 'undefined')
      console.error(`Unknown field ${fieldName ?? ''}`, { resource });
    else if (typeof resource === 'undefined' || resource === null)
      /*
       * Actually this probably shouldn't be an error. it can
       * happen, for instance, in the collectors list if
       * the collector has not been defined yet.
       */
      console.error("resource doesn't exist");
    else return { resource, field };
    return undefined;
  });
}
