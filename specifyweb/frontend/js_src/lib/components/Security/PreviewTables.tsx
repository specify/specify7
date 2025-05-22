import React from 'react';

import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { userText } from '../../localization/user';
import type { IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { group } from '../../utils/utils';
import { schema } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import type { PermissionsQueryItem } from '../Permissions';
import { getTablePermissions } from '../Permissions';
import type { PreviewCell } from './Preview';
import { PreviewRow } from './PreviewComponents';
import { isUncommonPermissionTable } from './registry';
import { resourceNameToTable } from './utils';

export function PreviewTables({
  query,
  isSystem,
  getOpenRoleUrl,
}: {
  readonly query: RA<PermissionsQueryItem>;
  readonly isSystem: boolean;
  readonly getOpenRoleUrl: (roleId: number) => string;
}): JSX.Element {
  const table = React.useMemo<RA<readonly [keyof Tables, IR<PreviewCell>]>>(
    () =>
      group(
        filterArray(
          query
            .filter(
              ({ resource }) =>
                resource in
                getTablePermissions()[schema.domainLevelIds.collection]
            )
            .map((entry) => {
              const table = resourceNameToTable(entry.resource);
              return isSystem === isUncommonPermissionTable(table)
                ? ([table.name, entry] as const)
                : undefined;
            })
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
          userText.read(),
          commonText.create(),
          commonText.update(),
          commonText.delete(),
          schemaText.table(),
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
