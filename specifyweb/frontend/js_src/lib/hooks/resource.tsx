import React from 'react';

import { serializeResource } from '../components/DataModel/helpers';
import { removeKey } from '../utils/utils';
import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import { resourceOn } from '../components/DataModel/resource';
import { schema } from '../components/DataModel/schema';
import type {
  LiteralField,
  Relationship,
} from '../components/DataModel/specifyField';
import type { GetOrSet, IR } from '../utils/types';
import { getValidationAttributes, resolveParser } from '../utils/uiParse';
import {
  AnySchema,
  SerializedModel,
  SerializedResource
} from '../components/DataModel/helperTypes';

/**
 * A wrapper for Backbone.Resource that integrates with React.useState for
 * easier state tracking
 *
 * @example Can detect field changes using React hooks:
 *   React.useEffect(()=>{}, [resource]);
 * @example Or only certain fields:
 *   React.useEffect(()=>{}, [resource.name, resource.fullname]);
 */
export function useResource<SCHEMA extends AnySchema>(
  model: SpecifyResource<SCHEMA>
): GetOrSet<SerializedResource<SCHEMA>> {
  const [resource, setResource] = React.useState<SerializedResource<SCHEMA>>(
    () => serializeResource(model)
  );

  const isChanging = React.useRef<boolean>(false);
  React.useEffect(() =>
    resourceOn(model, 'change', () => {
      if (isChanging.current) return;
      const newResource = serializeResource(model);
      previousResourceRef.current = newResource;
      setResource(newResource);
    })
  );

  const previousResourceRef =
    React.useRef<SerializedResource<SCHEMA>>(resource);
  const previousModel = React.useRef(model);
  React.useEffect(() => {
    if (previousModel.current !== model) {
      previousModel.current = model;
      const newResource = serializeResource(model);
      previousResourceRef.current = newResource;
      setResource(newResource);
      return;
    }
    const changes = Object.entries(resource).filter(
      ([key, newValue]) =>
        (newValue as unknown) !== previousResourceRef.current[key]
    );
    if (changes.length === 0) return;

    isChanging.current = true;
    changes.forEach(([key, newValue]) =>
      model.set(key as 'resource_uri', newValue as never)
    );
    isChanging.current = false;

    previousResourceRef.current = resource;
  }, [resource, model]);

  return [resource, setResource];
}

export const deserializeResource = <SCHEMA extends AnySchema>(
  serializedResource: SerializedModel<SCHEMA> | SerializedResource<SCHEMA>
): SpecifyResource<SCHEMA> =>
  new schema.models[
    /**
     * This assertion, while not required by TypeScript, is needed to fix
     * a typechecking performance issue (it was taking 5s to typecheck this
     * line according to TypeScript trace analyzer)
     */
    serializedResource._tableName
  ].Resource(removeKey(serializedResource, '_tableName'));

/** Hook for getting save blockers for a model's field */
export function useSaveBlockers({
  resource,
  fieldName,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly fieldName: string;
}): string {
  const [errors, setErrors] = React.useState<string>(
    () => resource.saveBlockers?.getFieldErrors(fieldName).join('\n') ?? ''
  );
  React.useEffect(
    () =>
      resourceOn(resource, 'blockersChanged', (): void =>
        setErrors(
          resource.saveBlockers?.getFieldErrors(fieldName).join('\n') ?? ''
        )
      ),
    [resource, fieldName]
  );
  return errors;
}

/**
 * Derive validation attributes for an <Input> from a field schema
 *
 */
export function useValidationAttributes(
  field: LiteralField | Relationship
): IR<string> {
  const [attributes, setAttributes] = React.useState<IR<string>>(() => {
    const parser = resolveParser(field);
    return getValidationAttributes(parser);
  });
  React.useEffect(() => {
    const parser = resolveParser(field);
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
      : path.length === 1
      ? model.fetch()
      : model.rgetPromise(path.slice(0, -1).join('.'));

  return getResource.then((resource) => {
    const field = model.specifyModel.getField(fieldName ?? '');
    if (field === undefined)
      console.error(`Unknown field ${fieldName ?? ''}`, { resource });
    else if (resource === undefined || resource === null)
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
