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
  getLink,
  className = '',
}: {
  readonly sortName: SORT_CONFIG;
  readonly headers: RR<FIELD_NAME, LocalizedString>;
  readonly data: RA<DATA>;
  readonly getLink: ((row: DATA) => string) | undefined;
  readonly className?: string | undefined;
}): JSX.Element {
  const indexColumn = Object.keys(headers)[0];
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
  return (
    <div
      className={`
        grid-table
        w-fit flex-1 grid-cols-[repeat(var(--cols),auto)] rounded border border-gray-400 dark:border-neutral-500 print:p-1
        ${className}
      `}
      role="table"
      style={{ '--cols': Object.keys(headers).length } as React.CSSProperties}
    >
      <div role="row">
        {Object.entries(headers).map(([name, label]) => (
          <div
            className={`
              sticky top-0 border border-gray-400 bg-[color:var(--background)]
              p-2 font-bold dark:border-neutral-500 print:p-1
            `}
            key={name}
            role="columnheader"
          >
            <Button.LikeLink
              onClick={(): void => handleSort(name as FIELD_NAME)}
            >
              {label}
              <SortIndicator fieldName={name} sortConfig={sortConfig} />
            </Button.LikeLink>
          </div>
        ))}
      </div>
      <div role="rowgroup">
        {data.map((row) => {
          const children = Object.keys(headers).map((column) => {
            const data = row[column];
            return (
              <Cell key={column}>
                {Array.isArray(data) ? data[1] : row[column]}
              </Cell>
            );
          });
          const key = row[indexColumn]?.toString();
          const link = getLink?.(row);
          return typeof link === 'string' ? (
            <Link.Default href={link} key={key} role="row">
              {children}
            </Link.Default>
          ) : (
            <div key={key} role="row">
              {children}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Cell({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <div
      className="border border-gray-400 p-2 dark:border-neutral-500 print:p-1"
      role="cell"
    >
      {children}
    </div>
  );
}
