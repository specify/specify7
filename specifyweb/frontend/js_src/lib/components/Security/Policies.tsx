import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { smoothScroll } from '../../utils/dom';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { removeItem, replaceItem, replaceKey } from '../../utils/utils';
import { Summary, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { ReadOnlyContext } from '../Core/Contexts';
import type { Policy, PolicyScope } from './Policy';
import { hasTableActions, SecurityPolicy } from './Policy';
import { getAllActions, permissionSeparator } from './utils';

export function SecurityPoliciesWrapper({
  policies,
  header,
  collapsable,
  children,
}: {
  readonly policies: RA<Policy> | undefined;
  readonly header: LocalizedString;
  readonly collapsable: boolean;
  readonly children: JSX.Element;
}): JSX.Element {
  const [orientation = 'vertical', setOrientation] = useCachedState(
    'securityTool',
    'policiesLayout'
  );

  const [isExpanded = true, setExpanded] = useCachedState(
    'securityTool',
    'institutionPoliciesExpanded'
  );
  const buttonTitle =
    orientation === 'vertical'
      ? userText.switchToHorizontalLayout()
      : userText.switchToVerticalLayout();
  const switchButton =
    (!collapsable || isExpanded) && Array.isArray(policies) ? (
      <Button.Small
        aria-label={buttonTitle}
        title={buttonTitle}
        variant={className.infoButton}
        onClick={(): void =>
          setOrientation(orientation === 'vertical' ? 'horizontal' : 'vertical')
        }
      >
        {orientation === 'horizontal'
          ? icons.switchVertical
          : icons.switchHorizontal}
      </Button.Small>
    ) : undefined;

  return collapsable ? (
    <details open={isExpanded}>
      <Summary onToggle={setExpanded}>
        <span
          className={`
            inline-flex items-center gap-4
            ${collapsable ? '' : 'text-xl'}
          `}
        >
          {header}
        </span>
        {/*
         * There is no switchButton here as interactive elements should not
         * be inside of <summary>
         */}
      </Summary>
      <div className="flex flex-col gap-2 pt-2">{children}</div>
    </details>
  ) : (
    <fieldset className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <h4>{header}</h4>
        {switchButton}
      </div>
      {children}
    </fieldset>
  );
}

/*
 * FEATURE: extend the checks for redundant policies and policies that don't have
 *   any effect (i.e, /permissions/user/roles/ has no effect unless
 *   /permission/roles/ is read)
 */
export function SecurityPolicies({
  policies,
  onChange: handleChange,
  scope,
  limitHeight,
}: {
  readonly policies: RA<Policy> | undefined;
  readonly onChange: (policies: RA<Policy>) => void;
  readonly scope: PolicyScope;
  readonly limitHeight: boolean;
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

  const [orientation = 'vertical'] = useCachedState(
    'securityTool',
    'policiesLayout'
  );

  const isReadOnly = React.useContext(ReadOnlyContext);
  return Array.isArray(policies) ? (
    <>
      <Ul
        className={`
          flex flex-col gap-2 overflow-auto
          ${limitHeight ? 'max-h-[theme(spacing.96)]' : ''}
        `}
        forwardRef={listRef}
      >
        {policies.map((policy, index) => (
          <SecurityPolicy
            isResourceMapped={(resource): boolean =>
              policies.some(
                (policy) =>
                  policy.resource === resource ||
                  policy.resource.startsWith(
                    `${resource}${permissionSeparator}`
                  )
              )
            }
            key={index}
            orientation={orientation}
            policy={policy}
            scope={scope}
            onChange={(policy): void => {
              if (policy === undefined)
                handleChange(removeItem(policies, index));
              else {
                const resourceChanged =
                  policies[index].resource !== policy.resource;
                const newItem =
                  /*
                   * Only auto-modify the list of actions if user changed
                   * the resource, not if user changed actions
                   */
                  resourceChanged ? mutatePolicy(policy) : policy;
                handleChange(replaceItem(policies, index, newItem));
              }
            }}
          />
        ))}
      </Ul>
      {scope !== 'institution' && (
        <p>{userText.excludedInstitutionalPoliciesDescription()}</p>
      )}
      {!isReadOnly && (
        <div>
          <Button.Success
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
            {commonText.add()}
          </Button.Success>
        </div>
      )}
    </>
  ) : (
    <>{commonText.loading()}</>
  );
}

function mutatePolicy(policy: Policy): Policy {
  const possibleActions = getAllActions(policy.resource);
  // Filter out non-existing actions
  const selectedActions = policy.actions.filter((action) =>
    possibleActions.includes(action)
  );
  return replaceKey(
    policy,
    'actions',
    /*
     * If new policy has only one action,
     * check it by default.
     * If new policy is for a CRUD resource,
     * check "read" by default
     */
    possibleActions.length === 1
      ? possibleActions
      : hasTableActions(possibleActions)
        ? f.unique(['read', ...selectedActions])
        : selectedActions
  );
}
