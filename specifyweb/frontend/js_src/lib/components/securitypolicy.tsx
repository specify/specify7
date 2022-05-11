import React from 'react';

import { f } from '../functools';
import {
  group,
  lowerToHuman,
  removeItem,
  replaceItem,
  replaceKey,
  toggleItem,
} from '../helpers';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { smoothScroll } from '../querybuilderutils';
import {
  actionToLabel,
  anyResource,
  getAllActions,
  getCollectionRegistriesFromPath,
  getRegistriesFromPath,
  partsToResourceName,
  resourceNameToParts,
} from '../securityutils';
import type { RA } from '../types';
import { defined, filterArray } from '../types';
import { Button, className, Input, Label, Select, Summary, Ul } from './basic';
import { icons } from './icons';
import { useCachedState } from './statecache';

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
  orientation,
}: {
  readonly policy: Policy;
  readonly isReadOnly: boolean;
  readonly onChange: (policy: Policy | undefined) => void;
  readonly scope: PolicyScope;
  readonly orientation: 'vertical' | 'horizontal';
}): JSX.Element {
  const resourceParts = resourceNameToParts(resource);
  const registries = (
    scope === 'institution'
      ? getRegistriesFromPath
      : getCollectionRegistriesFromPath
  )(resourceParts);
  const registryParts = registries
    .map((items, index) => ({
      ...items,
      // Create an entry if policy is unknown to the front-end
      ...(typeof resourceParts[index] === 'string' &&
      typeof items?.[resourceParts[index]] === 'undefined'
        ? {
            [resourceParts[index]]: {
              actions,
              children: {},
              groupName: '',
              label: lowerToHuman(resourceParts[index]),
            },
          }
        : {}),
    }))
    .filter((items) => Object.keys(items ?? {}).length > 0);
  const isUnknownResource = registries.includes(undefined);
  const possibleActions = isUnknownResource
    ? actions
    : registryParts.slice(-1)[0]?.[resourceParts.slice(-1)[0]]?.actions;
  // If user has actions that aren't known, display them anyway
  const extendedActions = Array.isArray(possibleActions)
    ? f.unique([...possibleActions, ...(actions ?? [])])
    : undefined;
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
        {Array.isArray(extendedActions) && possibleActions.length > 0 && (
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
                  key={action}
                  className={
                    orientation === 'vertical' ? undefined : 'contents'
                  }
                >
                  <Label.ForCheckbox
                    className={orientation === 'vertical' ? undefined : 'mr-2'}
                  >
                    <Input.Checkbox
                      onValueChange={(): void =>
                        handleChange({
                          resource,
                          actions: toggleItem(actions, action),
                        })
                      }
                      checked={actions.includes(action)}
                      /*
                       * If no checkboxes are checked, mark all as required.
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
  collapsable,
  scope,
}: {
  readonly policies: RA<Policy> | undefined;
  readonly isReadOnly: boolean;
  readonly onChange: (policies: RA<Policy>) => void;
  readonly header?: string;
  readonly collapsable: boolean;
  readonly scope: PolicyScope;
}): JSX.Element {
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const policyCountRef = React.useRef<number>(policies?.length ?? -1);
  // Scroll the list to bottom when new policy is added
  React.useEffect(() => {
    // Don't auto-scroll on initial load
    if (policyCountRef.current === -1 && Array.isArray(policies))
      policyCountRef.current = policies.length;
    if (
      (policies?.length ?? 0) > policyCountRef.current &&
      listRef.current !== null
    )
      smoothScroll(listRef.current, listRef.current.scrollHeight);
    policyCountRef.current = policies?.length ?? -1;
  }, [policies]);

  const [orientation = 'vertical', setOrientation] = useCachedState({
    bucketName: 'securityTool',
    cacheName: 'policiesLayout',
    defaultValue: 'vertical',
    staleWhileRefresh: false,
  });

  const children = Array.isArray(policies) ? (
    <>
      <Ul
        className="flex flex-col gap-2 overflow-auto max-h-[theme(spacing.96)]"
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
                  ? replaceItem(
                      policies,
                      index,
                      f.var(getAllActions(policy.resource), (possibleActions) =>
                        possibleActions.length === 1 &&
                        policy.actions.length === 0
                          ? replaceKey(policy, 'actions', possibleActions)
                          : policy
                      )
                    )
                  : removeItem(policies, index)
              )
            }
            orientation={orientation}
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
  );

  const [isCollapsed = true, setCollapsed] = useCachedState({
    bucketName: 'securityTool',
    cacheName: 'institutionPoliciesCollapsed',
    defaultValue: true,
    staleWhileRefresh: false,
  });

  const buttonTitle =
    orientation === 'vertical'
      ? adminText('switchToHorizontalLayout')
      : adminText('switchToVerticalLayout');
  const switchButton =
    (!collapsable || !isCollapsed) && Array.isArray(policies) ? (
      <Button.Small
        variant={className.blueButton}
        title={buttonTitle}
        aria-label={buttonTitle}
        onClick={(): void =>
          setOrientation(orientation === 'vertical' ? 'horizontal' : 'vertical')
        }
      >
        {orientation === 'vertical'
          ? icons.switchVertical
          : icons.switchHorizontal}
      </Button.Small>
    ) : undefined;

  return collapsable ? (
    <details open={!isCollapsed}>
      <Summary onToggle={setCollapsed}>
        <span className="inline-flex items-center gap-4">
          {header}
          {switchButton}
        </span>
      </Summary>
      <div className="flex flex-col gap-2 pt-2">{children}</div>
    </details>
  ) : (
    <fieldset className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <h4 className={className.headerGray}>{header}</h4>
        {switchButton}
      </div>
      {children}
    </fieldset>
  );
}
