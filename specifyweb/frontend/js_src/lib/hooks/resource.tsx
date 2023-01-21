import React from 'react';

import { fetchDistantRelated } from '../components/DataModel/helpers';
import type {
  AnySchema,
  SerializedResource,
} from '../components/DataModel/helperTypes';
import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import { resourceOn } from '../components/DataModel/resource';
import { serializeResource } from '../components/DataModel/serializers';
import type {
  LiteralField,
  Relationship,
} from '../components/DataModel/specifyField';
import {
  getValidationAttributes,
  resolveParser,
} from '../utils/parser/definitions';
import type { GetOrSet, IR, RA } from '../utils/types';

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
    resourceOn(
      model,
      'change',
      () => {
        if (isChanging.current) return;
        const newResource = serializeResource(model);
        previousResourceRef.current = newResource;
        setResource(newResource);
      },
      false
    )
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

/** Hook for getting save blockers for a model's field */
export function useSaveBlockers({
  resource,
  fieldName,
}: {
  readonly resource: SpecifyResource<AnySchema> | undefined;
  readonly fieldName: string;
}): string {
  const [errors, setErrors] = React.useState<string>(
    () => resource?.saveBlockers?.getFieldErrors(fieldName).join('\n') ?? ''
  );
  React.useEffect(
    () =>
      resource === undefined
        ? undefined
        : resourceOn(
            resource,
            'blockersChanged',
            (): void =>
              setErrors(
                resource.saveBlockers?.getFieldErrors(fieldName).join('\n') ??
                  ''
              ),
            false
          ),
    [resource, fieldName]
  );
  return errors;
}

export function useDistantRelated(
  resource: SpecifyResource<AnySchema>,
  fields: RA<LiteralField | Relationship> | undefined
): Awaited<ReturnType<typeof fetchDistantRelated>> {
  const [data, setData] =
    React.useState<Awaited<ReturnType<typeof fetchDistantRelated>>>(undefined);
  React.useEffect(() => {
    if (fields === undefined || fields.length === 0) return undefined;
    let destructorCalled = false;
    const destructor = resourceOn(
      resource,
      `change:${fields[0].name}`,
      async () =>
        fetchDistantRelated(resource, fields)
          .then((data) => (destructorCalled ? undefined : setData(data)))
          .catch(fail),
      true
    );
    return (): void => {
      destructor();
      destructorCalled = true;
    };
  }, [resource, fields]);
  return data;
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
