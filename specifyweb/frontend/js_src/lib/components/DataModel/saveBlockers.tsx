/**
 * Save Blocker is an error on resource that prevents it from being saved
 * and needs to be resolved by the user
 */

import React from 'react';

import { eventListener } from '../../utils/events';
import { f } from '../../utils/functools';
import type { GetOrSet, RA } from '../../utils/types';
import { removeItem } from '../../utils/utils';
import { softError } from '../Errors/assert';
import { softFail } from '../Errors/Crash';
import type { AnySchema } from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { ResourceBase } from './resourceApi';
import type { LiteralField, Relationship } from './specifyField';
import type { Collection } from './specifyTable';

const saveBlockers = new WeakMap<
  SpecifyResource<AnySchema>,
  ResourceBlockers
>();

type ResourceBlockers = {
  readonly blockers: RA<Blocker>;
  readonly listeners: WeakMap<
    LiteralField | Relationship,
    RA<(blocker: Blocker) => boolean>
  >;
};

const blockerEvents = eventListener<{
  readonly change: SpecifyResource<AnySchema>;
}>();

export type Blocker = {
  readonly field: RA<LiteralField | Relationship>;
  readonly message: string;
};
type BlockerWithResource = Blocker & {
  readonly resources: RA<SpecifyResource<AnySchema>>;
};

export function useSaveBlockers(
  resource: SpecifyResource<AnySchema> | undefined,
  field: LiteralField | Relationship | undefined
): GetOrSet<RA<string>> {
  const [blockers, setBlockers] = React.useState<RA<string>>([]);

  React.useEffect(
    () =>
      blockerEvents.on(
        'change',
        (changedResource) => {
          if (
            field === undefined ||
            resource === undefined ||
            (changedResource !== resource && changedResource !== undefined)
          )
            return;
          setBlockers(getFieldBlockers(resource, field));
        },
        true
      ),
    [resource, field]
  );

  return [
    blockers,
    React.useCallback(
      (errors) => {
        if (resource === undefined || field === undefined) {
          softFail(
            new Error('Unable to set blockers on undefined resource or field'),
            {
              errors,
              resource,
              field,
            }
          );
          return;
        }
        const resolvedErrors =
          typeof errors === 'function'
            ? errors(getFieldBlockers(resource, field))
            : errors;
        const blockers = f.unique(resolvedErrors).map((error) => ({
          field: [field],
          message: error,
        }));
        const resourceBlockers = getResourceBlockers(resource)!;
        const newBlockers = [
          ...resourceBlockers.blockers.filter(
            (blocker) =>
              blocker.field.length === 1 && blocker.field[0] !== field
          ),
          ...blockers,
        ];
        saveBlockers.set(resource, {
          ...resourceBlockers,
          blockers: newBlockers,
        });
        blockerEvents.trigger('change', resource);
      },
      [resource, field]
    ),
  ];
}

function getFieldBlockers(
  resource: SpecifyResource<AnySchema>,
  field: LiteralField | Relationship
): RA<string> {
  const blockers = saveBlockers.get(resource)?.blockers ?? [];
  return blockers
    .filter(
      (blocker) => blocker.field.length === 1 && blocker.field[0] === field
    )
    .map(({ message }) => message);
}

function getResourceBlockers(
  resource: SpecifyResource<AnySchema>
): ResourceBlockers {
  if (!saveBlockers.has(resource))
    saveBlockers.set(resource, { blockers: [], listeners: new Map() });
  return saveBlockers.get(resource)!;
}

export function useAllSaveBlockers(
  resource: SpecifyResource<AnySchema> | undefined
): RA<BlockerWithResource> {
  const [blockers, setBlockers] = React.useState<RA<BlockerWithResource>>([]);
  React.useEffect(
    () =>
      resource === undefined
        ? undefined
        : resource.noBusinessRules
        ? setBlockers([])
        : blockerEvents.on(
            'change',
            () => setBlockers(getAllBlockers(resource)),
            true
          ),
    [resource]
  );
  return blockers;
}

/**
 * Recursively get all blockers for current resource and all children resources
 */
const getAllBlockers = (
  resource: SpecifyResource<AnySchema>
): RA<BlockerWithResource> => [
  ...(saveBlockers.get(resource)?.blockers.map((blocker) => ({
    ...blocker,
    resources: [resource],
  })) ?? []),
  ...Object.entries(resource.dependentResources).flatMap(
    ([fieldName, collectionOrResource]) =>
      (collectionOrResource instanceof ResourceBase
        ? getAllBlockers(collectionOrResource as SpecifyResource<AnySchema>)
        : (collectionOrResource as Collection<AnySchema>).models.flatMap(
            getAllBlockers
          )
      ).map(({ field, resources, message }) => ({
        field: [resource.specifyTable.strictGetField(fieldName), ...field],
        resources: [...resources, resource],
        message,
      }))
  ),
];

/**
 * Add save blocker error handler. Each callback can return a boolean
 * indicating whether error has been displayed to the user. If false is
 * returned, the generic error handler is used (usually an error dialog)
 */
export function useBlockerHandler(
  resource: SpecifyResource<AnySchema> | undefined,
  field: LiteralField | Relationship | undefined,
  callback: (blocker: Blocker) => boolean
): void {
  React.useEffect(() => {
    if (resource === undefined || field === undefined) return undefined;
    const { listeners } = getResourceBlockers(resource)!;

    listeners.set(field, [...(listeners.get(field) ?? []), callback]);
    return (): void => {
      const fieldListeners = listeners.get(field) ?? [];
      const firstIndex = fieldListeners.indexOf(callback);
      if (firstIndex === -1) softError('Unable to find callback to remove');
      else listeners.set(field, removeItem(fieldListeners, firstIndex));
    };
  }, [resource, field, callback]);
}

/**
 * For each blocker, fire the blocker handler if set. Return the first blocker
 * that does not have any handler function setup.
 */
export function findUnclaimedBlocker(
  blockers: RA<BlockerWithResource>
): Blocker | undefined {
  return blockers.find((blocker) => {
    const {
      field,
      resources: [resource, ...children],
      message,
    } = blocker;
    if (field.length === 1) {
      const listeners = getResourceBlockers(resource)?.listeners;
      const currentListeners = listeners.get(field[0]) ?? [];
      return currentListeners.some((listener) => listener(blocker));
    } else
      return (
        findUnclaimedBlocker([
          {
            field: field.slice(1),
            resources: children,
            message,
          },
        ]) !== undefined
      );
  });
}
