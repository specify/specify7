import React from 'react';

import type { Tables } from '../DataModel/types';
import { f } from '../../utils/functools';
import { group, sortFunction } from '../../utils/utils';
import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import type { PermissionsQueryItem } from '../Permissions';
import {
  getTablePermissions,
  queryUserPermissions,
  tableActions,
} from '../Permissions';
import { hasPermission } from '../Permissions/helpers';
import { schema } from '../DataModel/schema';
import {
  actionToLabel,
  compressPermissionQuery,
  partsToResourceName,
  resourceNameToLabel,
  resourceNameToModel,
  resourceNameToParts,
} from './utils';
import type { IR, R, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { userInformation } from '../InitialContext/userInformation';
import { TableIcon } from '../Molecules';
import { useAsyncState, useId } from '../../hooks/hooks';
import { useCachedState } from '../../hooks/statecache';
import { Link } from '../Atoms/Link';
import { Input, Label } from '../Atoms/Form';
import { Summary, Ul } from '../Atoms';
import { className } from '../Atoms/className';

function ReasonExplanation({
  cell: { matching_role_policies, matching_user_policies },
  getOpenRoleUrl,
}: {
  readonly cell: Cell;
  readonly getOpenRoleUrl: (roleId: number) => string;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="grid-table grid-cols-[auto_auto_auto] rounded border border-gray-500"
        role="table"
      >
        <div role="row">
          {[
            adminText('collectionUserRoles'),
            adminText('action'),
            adminText('resource'),
          ].map((label, index, { length }) => (
            <div
              className={`
                bg-gray-350 p-2 dark:bg-neutral-600
                ${
                  index === 0
                    ? 'rounded-l'
                    : index + 1 === length
                    ? 'rounded-r'
                    : ''
                }
              `}
              key={index}
              role="columnheader"
            >
              {label}
            </div>
          ))}
        </div>
        <div role="rowgroup">
          {matching_role_policies.map((role, index) => (
            <Link.Default
              href={getOpenRoleUrl(role.roleid)}
              key={index}
              role="row"
            >
              {[
                role.rolename,
                actionToLabel(role.action),
                resourceNameToLabel(role.resource),
              ].map((value, index) => (
                <div className="p-2" key={index} role="cell">
                  {value}
                </div>
              ))}
            </Link.Default>
          ))}
          {matching_role_policies.length === 0 && (
            <div role="row">
              <div className="col-span-full p-2" role="cell">
                {adminText('none')}
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        className="grid-table w-full grid-cols-[auto_auto_auto_auto] rounded border border-gray-500"
        role="table"
      >
        <div role="row">
          {[
            adminText('userPolicies'),
            schema.models.Collection.label,
            adminText('action'),
            adminText('resource'),
          ].map((label, index, { length }) => (
            <div
              className={`
                bg-gray-350 p-2 dark:bg-neutral-600
                ${
                  index === 0
                    ? 'rounded-l'
                    : index + 1 === length
                    ? 'rounded-r'
                    : ''
                }
              `}
              key={index}
              role="columnheader"
            >
              {label}
            </div>
          ))}
        </div>
        <div role="rowgroup">
          {matching_user_policies.map((policy, index) => (
            <div key={index} role="row">
              {[
                policy.userid === null
                  ? adminText('allUsers')
                  : adminText('thisUser'),
                policy.collectionid === null
                  ? adminText('allCollections')
                  : adminText('thisCollection'),
                actionToLabel(policy.action),
                resourceNameToLabel(policy.resource),
              ].map((value, index) => (
                <div className="p-2" key={index} role="cell">
                  {value}
                </div>
              ))}
            </div>
          ))}
          {matching_user_policies.length === 0 && (
            <div role="row">
              <div className="col-span-full p-2" role="cell">
                {adminText('none')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewRow({
  row,
  tableName,
  getOpenRoleUrl,
}: {
  readonly row: IR<Cell>;
  readonly tableName: keyof Tables;
  readonly getOpenRoleUrl: (roleId: number) => string;
}): JSX.Element {
  const [view, setView] = React.useState<
    typeof tableActions[number] | undefined
  >(undefined);
  const id = useId('preview-row');
  return (
    <>
      <div aria-controls={id('reason')} role="row">
        {tableActions.map((action) => (
          <div
            className={`
              cursor-pointer justify-center rounded p-2
              ${view === action ? 'bg-brand-100 dark:bg-brand-500' : ''}
            `}
            key={action}
            role="cell"
            onClick={(): void => setView(action === view ? undefined : action)}
          >
            <Input.Checkbox
              aria-expanded={view === action}
              checked={row[action].allowed}
              className="pointer-events-none"
              disabled
            />
          </div>
        ))}
        <div className="p-2" role="cell">
          <TableIcon label={false} name={tableName} />
          {schema.models[tableName].label}
        </div>
      </div>
      <div
        className={typeof view === 'string' ? '' : '!hidden'}
        id={id('reason')}
        role="row"
      >
        {typeof view === 'string' && (
          <div className="col-span-full py-2" role="cell">
            <ReasonExplanation
              cell={row[view]}
              getOpenRoleUrl={getOpenRoleUrl}
            />
          </div>
        )}
      </div>
    </>
  );
}

type Cell = Omit<PermissionsQueryItem, 'action'>;

function PreviewTables({
  query,
  isSystem,
  getOpenRoleUrl,
}: {
  readonly query: RA<PermissionsQueryItem>;
  readonly isSystem: boolean;
  readonly getOpenRoleUrl: (roleId: number) => string;
}): JSX.Element {
  const table = React.useMemo<RA<readonly [keyof Tables, IR<Cell>]>>(
    () =>
      group(
        filterArray(
          query
            .filter(
              ({ resource }) =>
                resource in
                getTablePermissions()[schema.domainLevelIds.collection]
            )
            .map((entry) =>
              f.var(resourceNameToModel(entry.resource), (model) =>
                isSystem === (model.isSystem || model.isHidden)
                  ? ([model.name, entry] as const)
                  : undefined
              )
            )
        )
      ).map(
        ([tableName, items]) =>
          [
            tableName,
            Object.fromEntries(
              items.map(({ action, ...rest }) => [action, rest])
            ),
          ] as const
      ),
    [query, isSystem]
  );
  return (
    <div
      className={`
        grid-table relative
        grid-cols-[repeat(4,min-content)_auto] overflow-x-hidden
      `}
      role="table"
    >
      <div role="row">
        {[
          adminText('read'),
          commonText('create'),
          commonText('update'),
          commonText('delete'),
          adminText('table'),
        ].map((header, index, { length }) => (
          <div
            className={`
              sticky top-0 bg-[color:var(--form-background)] p-2 ${
                index === 0
                  ? 'rounded-l'
                  : index + 1 === length
                  ? 'rounded-r'
                  : ''
              }
            `}
            key={header}
            role="columnheader"
          >
            {header}
          </div>
        ))}
      </div>
      <div role="rowgroup">
        {table.map(([tableName, permissions]) => (
          <PreviewRow
            getOpenRoleUrl={getOpenRoleUrl}
            key={tableName}
            row={permissions}
            tableName={tableName}
          />
        ))}
      </div>
    </div>
  );
}

export type Tree = {
  readonly label: string;
  readonly children: IR<Tree>;
  readonly resource: string;
  readonly actions: RA<Omit<PermissionsQueryItem, 'resource'>>;
};

type WritableTree = {
  readonly label: string;
  readonly children: R<WritableTree>;
  readonly resource: string;
  readonly actions: RA<Omit<PermissionsQueryItem, 'resource'>>;
};

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
                      <ReasonExplanation
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

function PreviewOperations({
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

export function PreviewPermissions({
  userId,
  userVersion,
  collectionId,
  changesMade,
}: {
  readonly userId: number;
  readonly userVersion: number;
  readonly collectionId: number;
  readonly changesMade: boolean;
}): JSX.Element | null {
  const [query] = useAsyncState(
    React.useCallback(
      async () =>
        (hasPermission('/permissions/policies/user', 'read', collectionId) &&
          hasPermission('/permissions/roles', 'read', collectionId)) ||
        userId === userInformation.id
          ? queryUserPermissions(userId, collectionId).then(
              compressPermissionQuery
            )
          : false,
      // Force requery user permissions when user is saved
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [userId, collectionId, userVersion]
    ),
    false
  );
  const [isCollapsed = false, setCollapsed] = useCachedState(
    'securityTool',
    'previewCollapsed'
  );
  const [isSystemCollapsed = false, setSystemCollapsed] = useCachedState(
    'securityTool',
    'advancedPreviewCollapsed'
  );

  const getOpenRoleUrl = (roleId: number): string =>
    `/specify/security/collection/${collectionId}/role/${roleId}/`;

  return query === false ? null : (
    <details open={isCollapsed}>
      <Summary className="text-xl" onToggle={setCollapsed}>
        {adminText('userPermissionPreview')}
      </Summary>
      {typeof query === 'object' ? (
        <>
          {changesMade && <p>{adminText('outOfDateWarning')}</p>}
          <div className="flex flex-1 flex-wrap gap-4">
            <div>
              <PreviewTables
                getOpenRoleUrl={getOpenRoleUrl}
                isSystem={false}
                query={query}
              />
              <details open={isSystemCollapsed}>
                <Summary
                  className={className.headerGray}
                  onToggle={setSystemCollapsed}
                >
                  {adminText('advancedTables')}
                </Summary>
                <PreviewTables
                  getOpenRoleUrl={getOpenRoleUrl}
                  isSystem
                  query={query}
                />
              </details>
            </div>
            {/**
             * When tree node is expanded, column width increases.
             * If there isn't enough space for new width, the column is moved
             * to be below the first one. From user's perspective it looks
             * as if the column has disappeared.
             * These classNames force the second column below the first one
             * on all but the largest screens
             **/}
            <div className="xl:w-full 2xl:w-auto">
              <PreviewOperations
                getOpenRoleUrl={getOpenRoleUrl}
                query={query}
              />
            </div>
          </div>
        </>
      ) : (
        commonText('loading')
      )}
    </details>
  );
}
