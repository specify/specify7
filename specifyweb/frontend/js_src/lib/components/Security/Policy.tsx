import React from 'react';

import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { group, lowerToHuman, toggleItem } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Label, Select } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { ReadOnlyContext } from '../Core/Contexts';
import { tableActions } from '../Permissions/definitions';
import { getRegistriesFromPath } from './registry';
import {
  actionToLabel,
  anyResource,
  getCollectionRegistriesFromPath,
  partsToResourceName,
  resourceNameToParts,
} from './utils';

export type Policy = {
  readonly resource: string;
  readonly actions: RA<string>;
};

/**
 * Institutional policies are ignored if set on a collection level, thus,
 * UI should hide them.
 */
export type PolicyScope = 'collection' | 'institution';

/**
 * Checks if a list of actions includes table CRUD actions
 */
export const hasTableActions = (actions: RA<string>): boolean =>
  tableActions.every((action) => actions.includes(action));

// REFACTOR: reduce size of this component
export function SecurityPolicy({
  policy: { resource, actions },
  isResourceMapped,
  onChange: handleChange,
  scope,
  orientation,
}: {
  readonly policy: Policy;
  readonly isResourceMapped: (resource: string) => boolean;
  readonly onChange: (policy: Policy | undefined) => void;
  readonly scope: PolicyScope;
  readonly orientation: 'horizontal' | 'vertical';
}): JSX.Element {
  const resourceParts = resourceNameToParts(resource);
  const registryFunction =
    scope === 'institution'
      ? getRegistriesFromPath
      : getCollectionRegistriesFromPath;
  const registries = registryFunction(resourceParts);
  const registryParts = registries
    .map((items, index) => ({
      ...items,
      // Create an entry if policy is unknown to the front-end
      ...(typeof resourceParts[index] === 'string' &&
      items?.[resourceParts[index]] === undefined
        ? {
            [resourceParts[index]]: {
              actions,
              children: {},
              groupName: '',
              label: lowerToHuman(resourceParts[index]),
              isInstitutional: false,
            },
          }
        : {}),
    }))
    .filter((items = {}) => Object.keys(items).length > 0);
  const isUnknownResource = registries.includes(undefined);
  const possibleActions = isUnknownResource
    ? actions
    : registryParts.at(-1)?.[resourceParts.at(-1)!]?.actions;
  // If user has actions that aren't known, display them anyway
  const extendedActions = Array.isArray(possibleActions)
    ? f.unique([...possibleActions, ...(actions ?? [])])
    : undefined;
  const isTablePolicy = f.maybe(extendedActions, hasTableActions);

  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <li className="flex flex-wrap gap-2">
      {!isReadOnly && (
        <Button.Small
          aria-label={commonText.remove()}
          className="print:hidden"
          title={commonText.remove()}
          variant={className.dangerButton}
          onClick={(): void => handleChange(undefined)}
        >
          {icons.trash}
        </Button.Small>
      )}
      <Ul className="contents">
        {filterArray(registryParts).map((registry, index) =>
          Object.keys(registry).length === 0 ? undefined : (
            <li key={index}>
              <Select
                className="h-full"
                disabled={isReadOnly}
                required
                value={resourceParts[index] ?? ''}
                onValueChange={(part): void => {
                  const parts = [...resourceParts.slice(0, index), part];
                  // If new part has only one child, select it (recursively)
                  while (true) {
                    const childResources = registryFunction(parts).at(-1);
                    if (
                      childResources === undefined ||
                      // Checking for 2, as first option is always anyResource
                      Object.keys(childResources).length !== 2
                    )
                      break;
                    const child = Object.keys(childResources).find(
                      (part) => part !== anyResource
                    );
                    if (
                      child === undefined ||
                      // Don't select the part if it is disabled
                      (childResources[child].actions.length > 0 &&
                        isResourceMapped(
                          partsToResourceName([...parts, child])
                        ))
                    )
                      break;
                    parts.push(child);
                  }
                  handleChange({
                    resource: partsToResourceName(parts),
                    actions,
                  });
                }}
              >
                <option key="0" value="" />
                {group(
                  Object.entries(registry).map(
                    ([partName, { groupName, ...rest }]) =>
                      [groupName, [partName, rest]] as const
                  )
                ).map(([groupName, permissions]) => {
                  const children = permissions.map(
                    (
                      [partName, { label, actions, isInstitutional }],
                      _index,
                      { length }
                    ) => {
                      const parts = resourceNameToParts(resource);
                      const optionResource = partsToResourceName([
                        ...parts.slice(0, index),
                        partName,
                      ]);
                      /*
                       * Don't show Any if there is only one other option,
                       * and it is the default value
                       */
                      return partName === anyResource &&
                        length <= 2 &&
                        resourceParts[index] !== anyResource ? undefined : (
                        <option
                          disabled={
                            /*
                             * Disable terminal resource parts if they are
                             * Already mapped
                             */
                            (actions.length > 0 &&
                              // Don't disable if this is the current resource
                              partsToResourceName(parts.slice(0, index + 1)) !==
                                optionResource &&
                              isResourceMapped(optionResource)) ||
                            /*
                             * Disable institutional policies on the
                             * collection level
                             */
                            (scope !== 'institution' && isInstitutional)
                          }
                          key={partName}
                          value={partName}
                        >
                          {label}
                        </option>
                      );
                    }
                  );
                  return groupName === '' ? (
                    children
                  ) : (
                    <optgroup key={groupName} label={groupName}>
                      {children}
                    </optgroup>
                  );
                })}
              </Select>
            </li>
          )
        )}
        {Array.isArray(extendedActions) && possibleActions!.length > 0 && (
          <li className="contents">
            <Ul
              className={
                orientation === 'vertical'
                  ? 'flex flex-col justify-center'
                  : 'contents'
              }
            >
              {extendedActions.map((action) => (
                <li
                  className={
                    orientation === 'vertical' ? undefined : 'contents'
                  }
                  key={action}
                >
                  <Label.Inline
                    className={orientation === 'vertical' ? undefined : 'mr-2'}
                  >
                    <Input.Checkbox
                      checked={actions.includes(action)}
                      disabled={isReadOnly}
                      required={
                        /*
                         * If no checkboxes are checked, mark all as required.
                         * This prevents creation of policies without any
                         * actions
                         */
                        actions.length === 0 ||
                        /*
                         * For table policies, always require giving "read"
                         * access as without it other actions do not work
                         */
                        (action === 'read' && isTablePolicy) ||
                        /*
                         * Can't export a query, unless have execute permissions
                         */
                        (resource === '/querybuilder/query' &&
                          action === 'execute')
                      }
                      onValueChange={(): void =>
                        handleChange({
                          resource,
                          actions: toggleItem(actions, action),
                        })
                      }
                    />
                    {actionToLabel(action)}
                  </Label.Inline>
                </li>
              ))}
            </Ul>
          </li>
        )}
      </Ul>
    </li>
  );
}
