import React from 'react';

import type { Tables } from '../datamodel';
import { group } from '../helpers';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import type { PermissionsQueryItem } from '../permissions';
import {
  getTablePermissions,
  queryUserPermissions,
  tableActions,
} from '../permissions';
import { schema } from '../schema';
import {
  actionToLabel,
  compressPermissionQuery,
  partsToResourceName,
  resourceNameToModel,
  resourceNameToParts,
  resourceToLabel,
} from '../securityutils';
import type { IR, R, RA } from '../types';
import { Button, className, Input, Label, Ul } from './basic';
import { TableIcon } from './common';
import { useAsyncState, useId } from './hooks';

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
        className="grid-table grid-cols-[repeat(3,auto)] border border-gray-500 w-full"
        role="table"
      >
        <div role="row">
          {[
            adminText('userRoles'),
            adminText('action'),
            adminText('resource'),
          ].map((label, index) => (
            <div
              role="columnheader"
              className="bg-gray-350 dark:bg-neutral-600 p-2"
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
                resourceToLabel(role.resource),
              ].map((value, index) => (
                <div role="cell" className="p-2" key={index}>
                  {value}
                </div>
              ))}
            </Button.LikeLink>
          ))}
          {matching_role_policies.length === 0 && (
            <div role="row">
              <div role="cell" className="col-span-3 p-2">
                {adminText('none')}
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        className="grid-table grid-cols-[repeat(4,auto)] border border-gray-500 w-full"
        role="table"
      >
        <div role="row">
          {[
            adminText('userPolicies'),
            commonText('collection'),
            adminText('action'),
            adminText('resource'),
          ].map((label, index) => (
            <div
              role="columnheader"
              className="bg-gray-350 dark:bg-neutral-600 p-2"
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
                resourceToLabel(policy.resource),
              ].map((value, index) => (
                <div role="cell" key={index} className="p-2">
                  {value}
                </div>
              ))}
            </div>
          ))}
          {matching_user_policies.length === 0 && (
            <div role="row">
              <div role="cell" className="col-span-4 p-2">
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
      <div className="cursor-pointer" role="row" aria-controls={id('reason')}>
        {tableActions.map((action) => (
          <div
            role="cell"
            className={`justify-center p-2 ${
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
          <TableIcon name={tableName} tableLabel={false} />
          {schema.models[tableName].label}
        </div>
      </div>
      <div
        role="row"
        className={typeof view === 'string' ? '' : '!hidden'}
        id={id('reason')}
      >
        {typeof view === 'string' && (
          <div role="cell" className="col-span-5 py-2">
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
  onOpenRole: handleOpenRole,
}: {
  readonly query: RA<PermissionsQueryItem>;
  readonly onOpenRole: (roleId: number) => void;
}): JSX.Element {
  const table = React.useMemo<RA<Readonly<[keyof Tables, IR<Cell>]>>>(
    () =>
      group(
        query
          .filter(({ resource }) => resource in getTablePermissions())
          .map(
            (entry) =>
              [resourceNameToModel(entry.resource).name, entry] as const
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
    [query]
  );
  return (
    <div
      className={`grid-table grid-cols-[repeat(4,min-content)_auto]
        relative overflow-x-hidden h-80`}
      role="table"
    >
      <div role="row">
        {[
          adminText('read'),
          commonText('create'),
          commonText('update'),
          commonText('delete'),
          adminText('table'),
        ].map((header) => (
          <div
            key={header}
            role="columnheader"
            className={`p-2 sticky top-0 ${className.containerBackground}`}
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
                        <Label.ForCheckbox>
                          <Input.Checkbox
                            disabled
                            checked={rest.allowed}
                            className="cursor-pointer"
                          />{' '}
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
          .filter(({ resource }) => !(resource in getTablePermissions()))
          .map(({ resource, ...rest }) => [resource, rest] as const)
      ).reduce<R<WritableTree>>((tree, [resource, actions]) => {
        const resourceParts = resourceNameToParts(resource);
        resourceParts.reduce<R<WritableTree>>(
          (place, part, index, { length }) => {
            place[part] ??= {
              label: resourceToLabel(
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
  collectionId,
  changesMade,
  onOpenRole: handleOpenRole,
}: {
  readonly userId: number;
  readonly collectionId: number;
  readonly changesMade: boolean;
  readonly onOpenRole: (roleId: number) => void;
}): JSX.Element {
  const [query] = useAsyncState(
    React.useCallback(
      async () =>
        queryUserPermissions(userId, collectionId).then(
          compressPermissionQuery
        ),
      [userId, collectionId]
    ),
    false
  );
  return (
    <section className="contents">
      <h4 className={className.headerGray}>{adminText('preview')}</h4>
      {typeof query === 'object' ? (
        <>
          {changesMade && <p>{adminText('outOfDateWarning')}</p>}
          <div className="flex flex-wrap flex-1 gap-4">
            <PreviewTables query={query} onOpenRole={handleOpenRole} />
            <PreviewOperations query={query} onOpenRole={handleOpenRole} />
          </div>
        </>
      ) : (
        commonText('loading')
      )}
    </section>
  );
}
