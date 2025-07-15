import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import type { IR, R, RA } from '../../utils/types';
import { group, sortFunction } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Input, Label } from '../Atoms/Form';
import { schema } from '../DataModel/schema';
import type { PermissionsQueryItem } from '../Permissions';
import { getTablePermissions } from '../Permissions';
import { PermissionExplanation } from './PreviewComponents';
import {
  actionToLabel,
  partsToResourceName,
  resourceNameToLabel,
  resourceNameToParts,
} from './utils';

export type Tree = {
  readonly label: LocalizedString;
  readonly children: IR<Tree>;
  readonly resource: string;
  readonly actions: RA<Omit<PermissionsQueryItem, 'resource'>>;
};
type WritableTree = {
  readonly label: LocalizedString;
  readonly children: R<WritableTree>;
  readonly resource: string;
  readonly actions: RA<Omit<PermissionsQueryItem, 'resource'>>;
};

export function PreviewOperations({
  query,
  getOpenRoleUrl,
}: {
  readonly query: RA<PermissionsQueryItem>;
  readonly getOpenRoleUrl: (roleId: number) => string;
}): JSX.Element {
  const tree = React.useMemo(
    () =>
      group(
        query
          .filter(
            ({ resource }) =>
              !(
                resource in
                getTablePermissions()[schema.domainLevelIds.collection]
              )
          )
          .map(({ resource, ...rest }) => [resource, rest] as const)
      ).reduce<R<WritableTree>>((tree, [resource, actions]) => {
        const resourceParts = resourceNameToParts(resource);
        resourceParts.reduce<R<WritableTree>>(
          (place, part, index, { length }) => {
            place[part] ??= {
              label: resourceNameToLabel(
                partsToResourceName(resourceParts.slice(0, index + 1))
              ),
              children: {},
              resource: partsToResourceName(resourceParts.slice(0, index)),
              actions: index + 1 === length ? actions : [],
            };
            return place[part].children;
          },
          tree
        );
        return tree;
      }, {}),
    [query]
  );
  return <TreeView getOpenRoleUrl={getOpenRoleUrl} tree={tree} />;
}

function TreeView({
  tree,
  getOpenRoleUrl,
}: {
  readonly tree: IR<Tree>;
  readonly getOpenRoleUrl: (roleId: number) => string;
}): JSX.Element {
  return (
    <Ul className="list-disc pl-5">
      {Object.entries(tree)
        .sort(sortFunction(([_name, { label }]) => label))
        .map(([name, { label, children, actions, resource }]) => (
          <li key={name}>
            {label}
            {actions.length > 0 && (
              <Ul className="pl-5">
                {actions.map(({ action, ...rest }) => (
                  <li key={action}>
                    <details>
                      <summary>
                        <Label.Inline className="pointer-events-none">
                          <Input.Checkbox checked={rest.allowed} disabled />
                          {actionToLabel(action)}
                        </Label.Inline>
                      </summary>
                      <PermissionExplanation
                        cell={{ ...rest, resource }}
                        getOpenRoleUrl={getOpenRoleUrl}
                      />
                    </details>
                  </li>
                ))}
              </Ul>
            )}
            {Object.keys(children).length > 0 && (
              <TreeView getOpenRoleUrl={getOpenRoleUrl} tree={children} />
            )}
          </li>
        ))}
    </Ul>
  );
}
