import React from 'react';

import type { Tables } from '../datamodel';
import { capitalize, group, lowerToHuman } from '../helpers';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import type { PermissionsQuery } from '../permissions';
import { getTablePermissions, queryUserPermissions } from '../permissions';
import {
  partsToResourceName,
  resourceNameToModel,
  resourceNameToParts,
  resourceToLabel,
} from '../securityutils';
import type { IR, R, RA } from '../types';
import { filterArray } from '../types';
import { Button, className, Input, Label, Ul } from './basic';
import { TableIcon } from './common';
import { useAsyncState, useBooleanState, useId } from './hooks';

function PreviewCell({ cell }: { readonly cell: Cell }): JSX.Element {
  return (
    <div role="cell" className="justify-center">
      <Input.Checkbox
        disabled
        checked={cell.allowed}
        className="cursor-pointer"
      />
    </div>
  );
}

function ReasonExplanation({
  cell: { matching_role_policies, matching_user_policies, resource },
  action,
  onOpenRole: handleOpenRole,
}: {
  readonly cell: Cell;
  readonly action: string;
  readonly onOpenRole: (roleId: number) => void;
}): JSX.Element {
  return (
    <div>
      <p>
        {matching_role_policies.length > 0
          ? adminText('userRoles')
          : adminText('noMatchingUserRoles')}
      </p>
      <Ul>
        {matching_role_policies.length > 0 &&
          matching_role_policies.map((role, index) => (
            <li key={index}>
              <Button.LikeLink
                onClick={(): void => handleOpenRole(role.roleid)}
              >
                {`${role.rolename}${
                  role.action === action ? '' : ` (${role.action})`
                }${
                  role.resource === resource
                    ? ''
                    : ` (${resourceToLabel(role.resource)})`
                }`}
              </Button.LikeLink>
            </li>
          ))}
      </Ul>
      <p>
        {matching_user_policies.length > 0
          ? adminText('userPolicies')
          : adminText('noMatchingUserPolicies')}
      </p>
      <Ul>
        {matching_user_policies.length > 0 &&
          matching_user_policies.map((policy, index) => (
            <li key={index}>
              {filterArray([
                policy.userid === null ? `${adminText('allUsers')}` : undefined,
                policy.collectionid === null
                  ? `${adminText('allCollections')}`
                  : undefined,
                policy.action === action ? undefined : policy.action,
                policy.resource === resource
                  ? undefined
                  : resourceToLabel(policy.resource),
              ]).join(' : ')}
            </li>
          ))}
      </Ul>
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
  const [isOpen, _, __, handleToggle] = useBooleanState();
  const id = useId('preview-row');
  return (
    <>
      <div
        className="cursor-pointer"
        role="row"
        onClick={handleToggle}
        aria-controls={id('reason')}
        aria-expanded={isOpen}
      >
        <PreviewCell cell={row.read} />
        <PreviewCell cell={row.create} />
        <PreviewCell cell={row.update} />
        <PreviewCell cell={row.delete} />
        <div role="cell">
          <TableIcon name={tableName} tableLabel={false} />
          {tableName}
        </div>
      </div>
      <div
        role="row"
        className={`col-span-5 ${isOpen ? '' : '!hidden'}`}
        id={id('reason')}
      >
        <div role="cell">
          {[
            ['read', adminText('read')],
            ['create', commonText('create')],
            ['update', commonText('update')],
            ['delete', commonText('delete')],
          ].map(([key, label]) => (
            <React.Fragment key={key}>
              {label}:
              <ReasonExplanation
                cell={row[key]}
                action={key}
                onOpenRole={handleOpenRole}
              />
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}

type Cell = Omit<PermissionsQuery['details'][number], 'action'>;

function PreviewTables({
  query,
  onOpenRole: handleOpenRole,
}: {
  readonly query: PermissionsQuery;
  readonly onOpenRole: (roleId: number) => void;
}): JSX.Element {
  const table = React.useMemo<RA<Readonly<[keyof Tables, IR<Cell>]>>>(
    () =>
      Object.entries(
        group(
          query.details
            .filter(({ resource }) => resource in getTablePermissions())
            .map(
              (entry) =>
                [resourceNameToModel(entry.resource).name, entry] as const
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
    [query]
  );
  return (
    <div
      className={`grid-table grid-cols-[repeat(4,min-content)_auto] gap-2
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
            className={`sticky top-0 ${className.containerBackground}`}
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
  readonly actions: RA<Omit<PermissionsQuery['details'][number], 'resource'>>;
};

type WritableTree = {
  readonly label: string;
  readonly children: R<WritableTree>;
  readonly resource: string;
  readonly actions: RA<Omit<PermissionsQuery['details'][number], 'resource'>>;
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
                          {lowerToHuman(action)}
                        </Label.ForCheckbox>
                      </summary>
                      <ReasonExplanation
                        cell={{ ...rest, resource }}
                        action={action}
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
  readonly query: PermissionsQuery;
  readonly onOpenRole: (roleId: number) => void;
}): JSX.Element {
  const tree = React.useMemo(
    () =>
      Object.entries(
        group(
          query.details
            .filter(({ resource }) => !(resource in getTablePermissions()))
            .map(({ resource, ...rest }) => [resource, rest] as const)
        )
      ).reduce<R<WritableTree>>((registry, [resource, actions]) => {
        const resourceParts = resourceNameToParts(resource);
        resourceParts.reduce<R<WritableTree>>(
          (place, part, index, { length }) => {
            place[part] ??= {
              label: capitalize(part),
              children: {},
              resource: partsToResourceName(resourceParts.slice(0, index)),
              actions: index + 1 === length ? actions : [],
            };
            return place[part].children;
          },
          registry
        );
        return registry;
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
      async () => queryUserPermissions(userId, collectionId),
      [userId, collectionId]
    ),
    false
  );
  return (
    <section className="contents">
      <h4>{adminText('preview')}</h4>
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
