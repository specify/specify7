import React from 'react';

import type { Tables } from '../datamodel';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import type { PermissionsQuery } from '../permissions';
import { getTablePermissions, queryUserPermissions } from '../permissions';
import { resourceNameToModel } from '../securityutils';
import type { IR, RA } from '../types';
import { group } from '../wbplanviewhelper';
import { className, Input } from './basic';
import { TableIcon } from './common';
import { useAsyncState, useBooleanState, useId } from './hooks';

function PreviewCell({ cell }: { readonly cell: Cell }): JSX.Element {
  return (
    <div role="cell" className="justify-center">
      <Input.Checkbox
        readOnly
        checked={cell.allowed}
        className="cursor-pointer"
      />
    </div>
  );
}

function PreviewRow({
  row,
  tableName,
}: {
  readonly row: IR<Cell>;
  readonly tableName: keyof Tables;
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
        className={isOpen ? undefined : '!hidden'}
        id={id('reason')}
      >
        {/* FIXME: humanize */}
        <pre role="cell" className="col-span-5">
          {JSON.stringify(row, null, '\t')}
        </pre>
      </div>
    </>
  );
}

type Cell = Omit<PermissionsQuery['details'][number], 'action' | 'resource'>;

function PreviewTables({
  query,
}: {
  readonly query: PermissionsQuery;
}): JSX.Element {
  const table = React.useMemo<RA<Readonly<[keyof Tables, IR<Cell>]>>>(
    () =>
      Object.entries(
        group(
          query.details
            .filter(({ resource }) => resource in getTablePermissions())
            .map(
              ({ resource, ...rest }) =>
                [resourceNameToModel(resource).name, rest] as const
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
          <PreviewRow key={tableName} row={permissions} tableName={tableName} />
        ))}
      </div>
    </div>
  );
}

export function PreviewPermissions({
  userId,
  collectionId,
  changesMade,
}: {
  readonly userId: number;
  readonly collectionId: number;
  readonly changesMade: boolean;
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
      <h4 className={className.h3}>{adminText('preview')}</h4>
      {typeof query === 'object' ? (
        <>
          {changesMade && <p>{adminText('outOfDateWarning')}</p>}
          <div className="flex flex-wrap flex-1 gap-4">
            <PreviewTables query={query} />
            <PreviewTables query={query} />
          </div>
        </>
      ) : (
        commonText('loading')
      )}
    </section>
  );
}
