import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import type { SortConfigs } from '../../utils/cache/definitions';
import type { RA, RR } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import type { SchemaViewerRow, SchemaViewerValue } from './helpers';

export function SchemaViewerTableList<
  SORT_CONFIG extends
    | 'schemaViewerFields'
    | 'schemaViewerRelationships'
    | 'schemaViewerTables',
  FIELD_NAME extends SortConfigs[SORT_CONFIG],
  DATA extends SchemaViewerRow<RR<FIELD_NAME, SchemaViewerValue>>
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
  const headerElements = React.useMemo(
    () =>
      Object.entries(headers).map(([name, label]) => (
        <Button.LikeLink onClick={(): void => handleSort(name as FIELD_NAME)}>
          {label}
          <SortIndicator fieldName={name} sortConfig={sortConfig} />
        </Button.LikeLink>
      )),
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
      headerElements={headerElements}
      headers={headers}
    />
  );
}

export function GenericSortedDataViewer<
  DATA extends SchemaViewerRow<RR<string, SchemaViewerValue>>
>({
  headers,
  data,
  getLink,
  headerElements,
  className = '',
  headerClassName = '',
  cellClassName,
}: {
  readonly headers: RR<string, JSX.Element | LocalizedString>;
  readonly headerElements: RA<JSX.Element>;
  readonly headerClassName?: string;
  readonly className?: string;
  readonly data: RA<DATA>;
  readonly getLink: ((row: DATA) => string) | undefined;
  readonly cellClassName?: (
    row: DATA,
    column: keyof DATA,
    index: number
  ) => string;
}): JSX.Element {
  const indexColumn = Object.keys(headers)[0];

  return (
    <div
      className={`grid-table flex-1 grid-cols-[repeat(var(--cols),auto)] rounded print:p-1 ${className}`}
      role="table"
      style={{ '--cols': Object.keys(headers).length } as React.CSSProperties}
    >
      <div role="row">
        {headerElements.map((element, index) => (
          <div
            className={`
              sticky top-0 border-gray-400 bg-[color:var(--background)]
              p-2 font-bold dark:border-neutral-500 print:p-1
            ${headerClassName}`}
            key={index}
            role="columnheader"
          >
            {element}
          </div>
        ))}
      </div>
      <div role="rowgroup">
        {data.map((row, index) => {
          const children = Object.keys(headers).map((column) => {
            const data = row[column];
            return (
              <div
                className={cellClassName?.(row, column, index)}
                key={column}
                role="cell"
              >
                {Array.isArray(data) ? data[1] : row[column]}
              </div>
            );
          });
          const key = row[indexColumn];
          if (process.env.NODE_ENV === 'development' && typeof key !== 'string')
            throw new Error(
              `Expected index column to be string. Instead found: ${typeof key}`
            );
          const link = getLink?.(row);
          return typeof link === 'string' ? (
            <Link.Default href={link} key={key as string} role="row">
              {children}
            </Link.Default>
          ) : (
            <div key={key as string} role="row">
              {children}
            </div>
          );
        })}
      </div>
    </div>
  );
}
