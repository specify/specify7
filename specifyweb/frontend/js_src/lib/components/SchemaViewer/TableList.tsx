import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import type { SortConfigs } from '../../utils/cache/definitions';
import type { RA, RR } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { GenericSortedDataViewer } from '../Molecules/GenericSortedDataViewer';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import type { SchemaViewerRow, SchemaViewerValue } from './helpers';

export function SchemaViewerTableList<
  SORT_CONFIG extends
    | 'schemaViewerFields'
    | 'schemaViewerRelationships'
    | 'schemaViewerTables',
  FIELD_NAME extends SortConfigs[SORT_CONFIG],
  DATA extends SchemaViewerRow<RR<FIELD_NAME, SchemaViewerValue>>,
>({
  sortName,
  headers,
  data: unsortedData,
  headerClassName,
  getLink,
}: {
  readonly sortName: SORT_CONFIG;
  readonly headers: RR<FIELD_NAME, JSX.Element | LocalizedString>;
  readonly data: RA<DATA>;
  readonly getLink: ((row: DATA) => string) | undefined;
  readonly className?: string | undefined;
  readonly headerClassName?: string;
  readonly forwardRef?: React.RefObject<HTMLDivElement>;
}): JSX.Element {
  const [sortConfig, handleSort, applySortConfig] = useSortConfig(
    sortName,
    'name'
  );
  const data = React.useMemo(
    () =>
      applySortConfig(unsortedData, (row) => {
        /* eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion */
        const data = row[sortConfig.sortField] as SchemaViewerValue;
        return Array.isArray(data) ? data[0] : data;
      }),
    [sortConfig, unsortedData, applySortConfig]
  );
  const headersWithButtons = React.useMemo(
    () =>
      Object.fromEntries(
        Object.entries(headers).map(([name, label]) => [
          name,
          <Button.LikeLink onClick={(): void => handleSort(name as FIELD_NAME)}>
            {label}
            <SortIndicator fieldName={name} sortConfig={sortConfig} />
          </Button.LikeLink>,
        ])
      ),
    [headers, handleSort, headerClassName]
  );
  return (
    <GenericSortedDataViewer<DATA>
      cellClassName={() =>
        'border border-gray-400 p-2 dark:border-neutral-500 print:p-1'
      }
      className="w-fit border border-gray-400 dark:border-neutral-500"
      data={data}
      getLink={getLink}
      headerClassName="border"
      headers={headersWithButtons}
    />
  );
}
