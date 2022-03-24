import React from 'react';

import adminText from '../localization/admin';
import commonText from '../localization/common';
import {
  anyAction,
  getRegistriesFromPath,
  partsToResourceName,
  resourceNameToParts,
} from '../securityutils';
import type { RA } from '../types';
import { defined, filterArray } from '../types';
import { f, lowerToHuman } from '../wbplanviewhelper';
import { Button, className, Select, selectMultipleSize } from './basic';
import { icons } from './icons';
import { removeItem, replaceItem } from './wbplanviewstate';

export type Policy = {
  readonly resource: string;
  readonly actions: RA<string>;
};

function PolicyView({
  policy: { resource, actions },
  isReadOnly,
  onChange: handleChange,
}: {
  readonly policy: Policy;
  readonly isReadOnly: boolean;
  readonly onChange: (policy: Policy | undefined) => void;
}): JSX.Element {
  const resourceParts = resourceNameToParts(resource);
  const registryParts = getRegistriesFromPath(resourceParts).filter(
    (items) => typeof items === 'object' && Object.keys(items).length > 0
  );
  const possibleActions =
    registryParts.slice(-1)[0]?.[resourceParts.slice(-1)[0]]?.actions;
  return (
    <li className="flex flex-wrap gap-2">
      <ul className="contents">
        {filterArray(registryParts).map((registry, index) =>
          Object.keys(registry).length === 0 ? undefined : (
            <li key={index} className="contents">
              <Select
                value={resourceParts[index] ?? '0'}
                disabled={isReadOnly}
                onValueChange={(part): void =>
                  handleChange({
                    resource: partsToResourceName([
                      ...resourceParts.slice(0, index),
                      part,
                      ...f.var(
                        replaceItem(resourceParts, index, part),
                        (newPath) =>
                          filterArray(
                            getRegistriesFromPath(newPath)
                              .slice(index + 1)
                              .map<string | undefined>(
                                (registry, index) =>
                                  registry?.[newPath[index]]?.label
                              )
                          )
                      ),
                    ]),
                    actions,
                  })
                }
              >
                <option value="0" />
                {Object.entries(defined(registry)).map(
                  ([partName, { label }], _index, { length }) =>
                    // Don't show Any if there is only one other option
                    partName === anyAction && length === 2 ? undefined : (
                      <option key={partName} value={partName}>
                        {label}
                      </option>
                    )
                )}
              </Select>
            </li>
          )
        )}
        {Array.isArray(possibleActions) &&
          possibleActions.length > 0 &&
          resourceParts.slice(-1)[0] !== '0' && (
            <li className="contents">
              <Select
                value={possibleActions.length > 1 ? actions : actions[0] ?? ''}
                multiple={possibleActions.length > 1}
                size={Math.min(possibleActions.length, selectMultipleSize)}
                onValuesChange={(actions): void =>
                  handleChange({
                    resource,
                    actions,
                  })
                }
              >
                {possibleActions.map((action) => (
                  <option key={action} value={action}>
                    {lowerToHuman(action)}
                  </option>
                ))}
              </Select>
            </li>
          )}
      </ul>
      <Button.Simple
        className={`${className.redButton} print:hidden`}
        title={commonText('remove')}
        aria-label={commonText('remove')}
        onClick={(): void => handleChange(undefined)}
      >
        {icons.trash}
      </Button.Simple>
    </li>
  );
}

export function PoliciesView({
  policies,
  isReadOnly,
  onChange: handleChange,
}: {
  readonly policies: RA<Policy> | undefined;
  readonly isReadOnly: boolean;
  readonly onChange: (policies: RA<Policy>) => void;
}): JSX.Element {
  return (
    <fieldset className="flex flex-col gap-2">
      <h4>{adminText('policies')}</h4>
      {Array.isArray(policies) ? (
        <>
          <ul className="flex flex-col gap-2 overflow-auto max-h-[theme(spacing.80)]">
            {policies.map((policy, index) => (
              <PolicyView
                key={index}
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
          </ul>
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
