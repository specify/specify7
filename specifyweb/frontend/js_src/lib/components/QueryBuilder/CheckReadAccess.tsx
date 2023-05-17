import React from 'react';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import type { RA } from '../../utils/types';
import { Ul } from '../Atoms';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQuery, Tables } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { getNoAccessTables } from './helpers';

export function CheckReadAccess({
  query,
}: {
  readonly query: SerializedResource<SpQuery>;
}): JSX.Element | null {
  const [noAccessTables, setNoAccessTables] = React.useState<RA<keyof Tables>>(
    getNoAccessTables(query.fields)
  );

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
