import React from 'react';

import type { Tables } from '../datamodel';
import { f } from '../functools';
import { group } from '../helpers';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import type { PermissionsQueryItem } from '../permissions';
import {
  getTablePermissions,
  hasPermission,
  queryUserPermissions,
  tableActions,
} from '../permissions';
import { schema } from '../schema';
import {
  actionToLabel,
  compressPermissionQuery,
  partsToResourceName,
  resourceNameToLabel,
  resourceNameToModel,
  resourceNameToParts,
} from '../securityutils';
import type { IR, R, RA } from '../types';
import { filterArray } from '../types';
import { userInformation } from '../userinfo';
import { Button, className, Input, Label, Summary, Ul } from './basic';
import { TableIcon } from './common';
import { useAsyncState, useId } from './hooks';
import { useCachedState } from './statecache';

function ReasonExplanation({
  cell: { matching_role_policies, matching_user_policies },
  onOpenRole: handleOpenRole,
}: {
  readonly cell: Cell;
  readonly onOpenRole: (roleId: number) => void;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="grid-table grid-cols-[auto_auto_auto] border border-gray-500 rounded"
        role="table"
      >
        <div role="row">
          {[
            adminText('collectionUserRoles'),
            adminText('action'),
            adminText('resource'),
          ].map((label, index, { length }) => (
            <div
              role="columnheader"
              className={`bg-gray-350 dark:bg-neutral-600 p-2 ${
                index === 0
                  ? 'rounded-l'
                  : index + 1 === length
                  ? 'rounded-r'
                  : ''
              }`}
              key={index}
            >
              {label}
            </div>
          ))}
        </div>
        <div role="rowgroup">
          {matching_role_policies.map((role, index) => (
            <Button.LikeLink
              role="row"
              key={index}
              onClick={(): void => handleOpenRole(role.roleid)}
            >
              {[
                role.rolename,
                actionToLabel(role.action),
                resourceNameToLabel(role.resource),
              ].map((value, index) => (
                <div role="cell" className="p-2" key={index}>
                  {value}
                </div>
              ))}
            </Button.LikeLink>
          ))}
          {matching_role_policies.length === 0 && (
            <div role="row">
              <div role="cell" className="col-span-full p-2">
                {adminText('none')}
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        className="grid-table w-full grid-cols-[auto_auto_auto_auto] border border-gray-500 rounded"
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
              role="columnheader"
              className={`bg-gray-350 dark:bg-neutral-600 p-2 ${
                index === 0
                  ? 'rounded-l'
                  : index + 1 === length
                  ? 'rounded-r'
                  : ''
              }`}
              key={index}
            >
              {label}
            </div>
          ))}
        </div>
        <div role="rowgroup">
          {matching_user_policies.map((policy, index) => (
            <div role="row" key={index}>
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
                <div role="cell" key={index} className="p-2">
                  {value}
                </div>
              ))}
            </div>
          ))}
          {matching_user_policies.length === 0 && (
            <div role="row">
              <div role="cell" className="col-span-full p-2">
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
  onOpenRole: handleOpenRole,
}: {
  readonly row: IR<Cell>;
  readonly tableName: keyof Tables;
  readonly onOpenRole: (roleId: number) => void;
}): JSX.Element {
  const [view, setView] = React.useState<
    undefined | typeof tableActions[number]
  >(undefined);
  const id = useId('preview-row');
  return (
    <>
      <div role="row" aria-controls={id('reason')}>
        {tableActions.map((action) => (
          <div
            role="cell"
            className={`justify-center p-2 cursor-pointer rounded ${
              view === action ? 'bg-brand-100 dark:bg-brand-500' : ''
            }`}
            key={action}
            onClick={(): void => setView(action === view ? undefined : action)}
          >
            <Input.Checkbox
              aria-expanded={view === action}
              disabled
              checked={row[action].allowed}
              className="pointer-events-none"
            />
          </div>
        ))}
        <div role="cell" className="p-2">
          <TableIcon name={tableName} label={false} />
          {schema.models[tableName].label}
        </div>
      </div>
      <div
        role="row"
        className={typeof view === 'string' ? '' : '!hidden'}
        id={id('reason')}
      >
        {typeof view === 'string' && (
          <div role="cell" className="col-span-full py-2">
            <ReasonExplanation cell={row[view]} onOpenRole={handleOpenRole} />
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
  onOpenRole: handleOpenRole,
}: {
  readonly query: RA<PermissionsQueryItem>;
  readonly isSystem: boolean;
  readonly onOpenRole: (roleId: number) => void;
}): JSX.Element {
  const table = React.useMemo<RA<Readonly<[keyof Tables, IR<Cell>]>>>(
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
      className={`grid-table grid-cols-[repeat(4,min-content)_auto]
        relative overflow-x-hidden`}
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
            key={header}
            role="columnheader"
            className={`p-2 sticky top-0 bg-[color:var(--form-background)] ${
              index === 0
                ? 'rounded-l'
                : index + 1 === length
                ? 'rounded-r'
                : ''
            }`}
          >
            {header}
          </div>
        ))}
      </div>
      <div role="rowgroup">
        {table.map(([tableName, permissions]) => (
          <PreviewRow
            key={tableName}
            row={permissions}
            tableName={tableName}
            onOpenRole={handleOpenRole}
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
  onOpenRole: handleOpenRole,
}: {
  readonly tree: IR<Tree>;
  readonly onOpenRole: (roleId: number) => void;
}): JSX.Element {
  return (
    <Ul className="pl-5 list-disc">
      {Object.entries(tree).map(
        ([name, { label, children, actions, resource }]) => (
          <li key={name}>
            {label}
            {actions.length > 0 && (
              <Ul className="pl-5">
                {actions.map(({ action, ...rest }) => (
                  <li key={action}>
                    <details>
                      <summary>
                        <Label.ForCheckbox className="pointer-events-none">
                          <Input.Checkbox disabled checked={rest.allowed} />
                          {actionToLabel(action)}
                        </Label.ForCheckbox>
                      </summary>
                      <ReasonExplanation
                        cell={{ ...rest, resource }}
                        onOpenRole={handleOpenRole}
                      />
                    </details>
                  </li>
                ))}
              </Ul>
            )}
            {Object.keys(children).length > 0 && (
              <TreeView tree={children} onOpenRole={handleOpenRole} />
            )}
          </li>
        )
      )}
    </Ul>
  );
}

function PreviewOperations({
  query,
  onOpenRole: handleOpenRole,
}: {
  readonly query: RA<PermissionsQueryItem>;
  readonly onOpenRole: (roleId: number) => void;
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
  return <TreeView tree={tree} onOpenRole={handleOpenRole} />;
}

export function PreviewPermissions({
  userId,
  userVersion,
  collectionId,
  changesMade,
  onOpenRole: handleOpenRole,
}: {
  readonly userId: number;
  readonly userVersion: number;
  readonly collectionId: number;
  readonly changesMade: boolean;
  readonly onOpenRole: (roleId: number) => void;
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
  const [isCollapsed = false, setCollapsed] = useCachedState({
    category: 'securityTool',
    key: 'previewCollapsed',
    defaultValue: false,
    staleWhileRefresh: false,
  });
  const [isSystemCollapsed = false, setSystemCollapsed] = useCachedState({
    category: 'securityTool',
    key: 'advancedPreviewCollapsed',
    defaultValue: false,
    staleWhileRefresh: false,
  });
  return query === false ? null : (
    <details open={isCollapsed}>
      <Summary className="text-xl" onToggle={setCollapsed}>
        {adminText('userPermissionPreview')}
      </Summary>
      {typeof query === 'object' ? (
        <>
          {changesMade && <p>{adminText('outOfDateWarning')}</p>}
          <div className="flex flex-wrap flex-1 gap-4">
            <div>
              <PreviewTables
                query={query}
                onOpenRole={handleOpenRole}
                isSystem={false}
              />
              <details open={isSystemCollapsed}>
                <Summary
                  className={className.headerGray}
                  onToggle={setSystemCollapsed}
                >
                  {adminText('advancedTables')}
                </Summary>
                <PreviewTables
                  query={query}
                  onOpenRole={handleOpenRole}
                  isSystem={true}
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
              <PreviewOperations query={query} onOpenRole={handleOpenRole} />
            </div>
          </div>
        </>
      ) : (
        commonText('loading')
      )}
    </details>
  );
}
