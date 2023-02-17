import React from 'react';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { RA } from '../../utils/types';
import { Ul } from '../Atoms';
import { SerializedResource } from '../DataModel/helperTypes';
import { SpQuery, Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission } from '../Permissions/helpers';
import { QueryFieldSpec } from './fieldSpec';

export function CheckReadAccess({
  query,
}: {
  readonly query: SerializedResource<SpQuery>;
}): JSX.Element | null {
  const [noAccessTables, setNoAccessTables] = React.useState<RA<keyof Tables>>(
    []
  );

  function accessTables(query: SerializedResource<SpQuery>): RA<keyof Tables> {
    const info = query.fields.flatMap((field) => {
      const fieldSpec = QueryFieldSpec.fromStringId(
        field.stringId,
        field.isRelFld ?? false
      );
      const relatedTable = fieldSpec.joinPath.map(({ model }) => model.name);
      return relatedTable;
    });

    const withoutDuplicates = new Set(info);

    const noAccessTables = Array.from(withoutDuplicates).filter(
      (name) => !hasTablePermission(name, 'read')
    );

    setNoAccessTables(noAccessTables);
    return info;
  }
  React.useEffect(() => {
    accessTables(query);
  }, []);

  return noAccessTables.length > 0 ? (
    <Dialog
      buttons={commonText.close()}
      header={queryText.noReadPermission()}
      onClose={(): void => setNoAccessTables([])}
    >
      <>
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
      </>
    </Dialog>
  ) : null;
}
