import React from 'react';

import { useCachedState } from '../../hooks/useCachedState';
import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { removeItem, replaceItem, replaceKey } from '../../utils/utils';
import { Summary, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { smoothScroll } from '../QueryBuilder/helpers';
import type { Policy, PolicyScope } from './Policy';
import { hasTableActions, SecurityPolicy } from './Policy';
import { getAllActions } from './utils';

export function SecurityPoliciesWrapper({
  policies,
  header,
  collapsable,
  children,
}: {
  readonly policies: RA<Policy> | undefined;
  readonly header: string;
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
      ? adminText('switchToHorizontalLayout')
      : adminText('switchToVerticalLayout');
  const switchButton =
    (!collapsable || isExpanded) && Array.isArray(policies) ? (
      <Button.Small
        aria-label={buttonTitle}
        title={buttonTitle}
        variant={className.blueButton}
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
  isReadOnly,
  onChange: handleChange,
  scope,
  limitHeight,
}: {
  readonly policies: RA<Policy> | undefined;
  readonly isReadOnly: boolean;
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
            isReadOnly={isReadOnly}
            isResourceMapped={(resource): boolean =>
              policies.some((policy) => policy.resource.startsWith(resource))
            }
            key={index}
            orientation={orientation}
            policy={policy}
            scope={scope}
            onChange={(policy): void =>
              handleChange(
                typeof policy === 'object'
                  ? replaceItem(
                      policies,
                      index,
                      /*
                       * Only auto-modify the list of actions if user changed
                       * the resource, not if user changed actions
                       */
                      policies[index].resource === policy.resource
                        ? policy
                        : f.var(
                            getAllActions(policy.resource),
                            (possibleActions) =>
                              f.var(
                                // Filter out non-existing actions
                                policy.actions.filter((action) =>
                                  possibleActions.includes(action)
                                ),
                                (selectedActions) =>
                                  replaceKey(
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
                                  )
                              )
                          )
                    )
                  : removeItem(policies, index)
              )
            }
          />
        ))}
      </Ul>
      {scope !== 'institution' && (
        <p>{adminText('excludedInstitutionalPoliciesDescription')}</p>
      )}
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
    <>{commonText('loading')}</>
  );
}
