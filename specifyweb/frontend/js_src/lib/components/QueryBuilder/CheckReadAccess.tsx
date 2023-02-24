import React from 'react';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import type { RA } from '../../utils/types';
import { Ul } from '../Atoms';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQuery, Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission } from '../Permissions/helpers';
import { QueryFieldSpec } from './fieldSpec';

export function CheckReadAccess({
  query,
}: {
  readonly query: SerializedResource<SpQuery>;
}): JSX.Element | null {
  const [noAccessTables, setNoAccessTables] =
    React.useState<RA<keyof Tables>>(getNoAccessTables);

  function getNoAccessTables(): RA<keyof Tables> {
    const tableNames = query.fields.flatMap((field) => {
      const fieldSpec = QueryFieldSpec.fromStringId(
        field.stringId,
        field.isRelFld ?? false
      );
      return fieldSpec.joinPath.map((field) =>
        field.isRelationship ? field.relatedModel.name : field.model.name
      );
    });

    const withoutDuplicates = new Set(tableNames);

    return Array.from(withoutDuplicates).filter(
      (name) => !hasTablePermission(name, 'read')
    );
  }

  return noAccessTables.length > 0 ? (
    <Dialog
      buttons={commonText.close()}
      header={queryText.noReadPermission()}
      onClose={(): void => setNoAccessTables([])}
    >
      {queryText.importNoReadPermission()}
      <Ul className="flex flex-col">
        {noAccessTables.map((table, index) => (
          <li className="font-bold" key={index}>
            <div className="flex gap-2">
              <TableIcon label name={table} />
              {table}
            </div>
          </li>
        ))}
      </Ul>
    </Dialog>
  ) : null;
}
