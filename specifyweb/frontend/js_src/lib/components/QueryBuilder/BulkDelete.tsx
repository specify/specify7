import React from 'react';

import { ajax } from '../../utils/ajax';
import { commonText } from '../../localization/common';
import { Button } from '../Atoms/Button';
import type { SpecifyTable } from '../DataModel/specifyTable';

export function QueryBulkDelete({
  table,
  totalCount,
  selectedRows,
  onDeleted,
  recordIds,
}: {
  readonly table: SpecifyTable;
  readonly totalCount: number;
  readonly selectedRows: ReadonlySet<number>;
  readonly onDeleted: () => void;
  readonly recordIds: any;
}): JSX.Element {
  const handleClick = (): void => {
    ajax<any>(
      `/bulk_copy/bulk_delete/${table.name}/`,
      {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: {
            ids: recordIds(),
        },
      }
    );
    onDeleted();
  }

  return (
    <Button.Small
    disabled={totalCount === undefined || totalCount === 0}
    onClick={handleClick}
    >
    {commonText.delete()}
    </Button.Small>
  );
}
