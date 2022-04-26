import React from 'react';

import { f } from '../functools';
import {
  group,
  lowerToHuman,
  removeItem,
  replaceItem,
  toggleItem,
} from '../helpers';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { smoothScroll } from '../querybuilderutils';
import {
  actionToLabel,
  anyResource,
  getCollectionRegistriesFromPath,
  getRegistriesFromPath,
  partsToResourceName,
  resourceNameToParts,
} from '../securityutils';
import type { RA } from '../types';
import { defined, filterArray } from '../types';
import { Button, className, Input, Label, Select, Ul } from './basic';
import { icons } from './icons';

export type Policy = {
  readonly resource: string;
  readonly actions: RA<string>;
};

/**
 * Institutional policies are ignored if set on a collection level, thus,
 * UI should hide them.
 */
export type PolicyScope = 'institution' | 'collection';

function PolicyView({
  policy: { resource, actions },
  isReadOnly,
  onChange: handleChange,
  scope,
}: {
  readonly policy: Policy;
  readonly isReadOnly: boolean;
  readonly onChange: (policy: Policy | undefined) => void;
  readonly scope: PolicyScope;
}): JSX.Element {
  const resourceParts = resourceNameToParts(resource);
  const registries = (
    scope === 'institution'
      ? getRegistriesFromPath
      : getCollectionRegistriesFromPath
  )(resourceParts);
  const registryParts = registries
    .map((items, index) => ({
      // Create an entry just in case the policy is unknown to the front-end
      ...(typeof resourceParts[index] === 'string'
        ? {
            [resourceParts[index]]: {
              actions,
              children: {},
              groupName: '',
              label: lowerToHuman(resourceParts[index]),
            },
          }
        : {}),
      ...items,
    }))
    .filter((items) => Object.keys(items ?? {}).length > 0);
  const isUnknownResource = registries.includes(undefined);
  const possibleActions = isUnknownResource
    ? actions
    : registryParts.slice(-1)[0]?.[resourceParts.slice(-1)[0]]?.actions;
  return (
    <li className="flex flex-wrap gap-2">
      <Ul className="contents">
        {filterArray(registryParts).map((registry, index) =>
          Object.keys(registry).length === 0 ? undefined : (
            <li key={index}>
              <Select
                className="h-full"
                value={resourceParts[index] ?? ''}
                disabled={isReadOnly}
                onValueChange={(part): void =>
                  handleChange({
                    resource: partsToResourceName([
                      ...resourceParts.slice(0, index),
                      part,
                    ]),
                    actions,
                  })
                }
                required
              >
                <option value="" key="0" />
                {group(
                  Object.entries(defined(registry)).map(
                    ([partName, { groupName, ...rest }]) =>
                      [groupName, [partName, rest]] as const
                  )
                ).map(([groupName, permissions]) =>
                  f.var(
                    permissions.map(
                      ([partName, { label }], _index, { length }) =>
                        /*
                         * Don't show Any if there is only one other option,
                         * and it is the default value
                         */
                        partName === anyResource &&
                        length <= 2 &&
                        resourceParts[index] !== anyResource ? undefined : (
                          <option key={partName} value={partName}>
                            {label}
                          </option>
                        )
                    ),
                    (children) =>
                      groupName === '' ? (
                        children
                      ) : (
                        <optgroup label={groupName} key={groupName}>
                          {children}
                        </optgroup>
                      )
                  )
                )}
              </Select>
            </li>
          )
        )}
        {Array.isArray(possibleActions) && possibleActions.length > 0 && (
          <li className="contents">
            {/* Math.min(possibleActions.length, selectMultipleSize) */}
            <Ul className="flex flex-col justify-center">
              {possibleActions.map((action) => (
                <li key={action}>
                  <Label.ForCheckbox>
                    <Input.Checkbox
                      onValueChange={(): void =>
                        handleChange({
                          resource,
                          actions: toggleItem(actions, action),
                        })
                      }
                      checked={actions.includes(action)}
                      /*
                       * If not checkboxes are checked, mark all as required.
                       * This prevents creation of policies without any
                       * actions
                       */
                      required={actions.length === 0}
                    />
                    {actionToLabel(action)}
                  </Label.ForCheckbox>
                </li>
              ))}
            </Ul>
          </li>
        )}
      </Ul>
      <Button.Small
        className="print:hidden"
        variant={className.redButton}
        title={commonText('remove')}
        aria-label={commonText('remove')}
        onClick={(): void => handleChange(undefined)}
      >
        {icons.trash}
      </Button.Small>
    </li>
  );
}

export function PoliciesView({
  policies,
  isReadOnly,
  onChange: handleChange,
  header = adminText('policies'),
  scope,
}: {
  readonly policies: RA<Policy> | undefined;
  readonly isReadOnly: boolean;
  readonly onChange: (policies: RA<Policy>) => void;
  readonly header?: string;
  readonly scope: PolicyScope;
}): JSX.Element {
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const policyCountRef = React.useRef<number>(policies?.length ?? 0);
  // Scroll the list to bottom when new policy is added
  React.useEffect(() => {
    if (
      (policies?.length ?? 0) > policyCountRef.current &&
      listRef.current !== null
    )
      smoothScroll(listRef.current, listRef.current.scrollHeight);
    policyCountRef.current = policies?.length ?? 0;
  }, [policies]);
  return (
    <fieldset className="flex flex-col gap-2">
      {scope === 'collection' && (
        <h4 className={className.headerGray}>{header}</h4>
      )}
      {Array.isArray(policies) ? (
        <>
          <Ul
            className="flex flex-col gap-2 overflow-auto max-h-[theme(spacing.80)]"
            forwardRef={listRef}
          >
            {policies.map((policy, index) => (
              <PolicyView
                key={index}
                scope={scope}
                policy={policy}
                isReadOnly={isReadOnly}
                onChange={(policy): void =>
                  handleChange(
                    typeof policy === 'object'
                      ? replaceItem(policies, index, policy)
                      : removeItem(policies, index)
                  )
                }
              />
            ))}
          </Ul>
          {!isReadOnly && (
            <div>
              <Button.Green
                onClick={(): void =>
                  handleChange([
                    ...policies,
                    {
                      resource: '',
                      actions: [],
                    },
                  ])
                }
              >
                {commonText('add')}
              </Button.Green>
            </div>
          )}
        </>
      ) : (
        commonText('loading')
      )}
    </fieldset>
  );
}
