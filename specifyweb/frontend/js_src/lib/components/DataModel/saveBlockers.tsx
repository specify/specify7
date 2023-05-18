/**
 * Save Blocker is an error on resource that prevents it from being saved
 * and needs to be resolved by the user
 */

import React from 'react';

import { eventListener } from '../../utils/events';
import type { GetOrSet, RA } from '../../utils/types';
import { removeItem } from '../../utils/utils';
import { softError } from '../Errors/assert';
import { softFail } from '../Errors/Crash';
import type { AnySchema } from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import type { LiteralField, Relationship } from './specifyField';

const saveBlockers = new WeakMap<
  SpecifyResource<AnySchema>,
  ResourceBlockers
>();

type ResourceBlockers = {
  readonly blockers: RA<Blocker>;
  readonly listeners: WeakMap<
    LiteralField | Relationship,
    RA<(blockers: RA<Blocker>) => boolean>
  >;
};

const blockerEvents = eventListener<{
  readonly change: SpecifyResource<AnySchema>;
}>();

type Blocker = {
  readonly field: LiteralField | Relationship;
  readonly message: string;
};

function getErrors(
  resource: SpecifyResource<AnySchema>,
  field: LiteralField | Relationship
): RA<string> {
  const blockers = saveBlockers.get(resource)?.blockers ?? [];
  return blockers
    .filter((blocker) => blocker.field === field)
    .map(({ message }) => message);
}

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
          setBlockers(getErrors(resource, field));
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
            ? errors(getErrors(resource, field))
            : errors;
        const blockers = resolvedErrors.map((error) => ({
          field,
          message: error,
        }));
        const resourceBlockers = getResourceBlockers(resource)!;
        const newBlockers = [
          ...resourceBlockers.blockers.filter(
            (blocker) => blocker.field !== field
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

function getResourceBlockers(
  resource: SpecifyResource<AnySchema>
): ResourceBlockers {
  if (!saveBlockers.has(resource))
    saveBlockers.set(resource, { blockers: [], listeners: new Map() });
  return saveBlockers.get(resource)!;
}

/**
 * Add save blocker error handler. Each callback can return a boolean
 * indicating whether error has been displayed to the user. If false is
 * returned, the generic error handler is used (usually an error dialog)
 */
export function useBlockerHandler(
  resource: SpecifyResource<AnySchema> | undefined,
  field: LiteralField | Relationship | undefined,
  callback: (blockers: RA<Blocker>) => boolean
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
