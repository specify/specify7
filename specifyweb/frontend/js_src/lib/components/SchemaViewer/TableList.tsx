import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import type { SortConfigs } from '../../utils/cache/definitions';
import type { RA, RR } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import type { SchemaViewerRow, SchemaViewerValue } from './helpers';

export function SchemaViewerTableList<
  SORT_CONFIG extends keyof SortConfigs,
  FIELD_NAME extends SortConfigs[SORT_CONFIG],
  DATA extends SchemaViewerRow<RR<FIELD_NAME, SchemaViewerValue>>
>({
  sortName,
  defaultSortField,
  headers,
  data: unsortedData,
  headerClassName,
  getLink,
}: {
  readonly sortName: SORT_CONFIG;
  readonly defaultSortField: FIELD_NAME;
  readonly headers: RR<FIELD_NAME, JSX.Element | LocalizedString>;
  readonly data: RA<DATA>;
  readonly getLink: ((row: DATA) => string) | undefined;
  readonly className?: string | undefined;
  readonly headerClassName?: string;
  readonly forwardRef?: React.RefObject<HTMLDivElement>;
}): JSX.Element {
  const [sortConfig, handleSort, applySortConfig] = useSortConfig(
    sortName,
    defaultSortField
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
  const elementHeaders = (
    <>
      {Object.entries(headers).map(([name, label]) => (
        <div
          className={`
              sticky top-0 border border-gray-400 bg-[color:var(--background)]
              p-2 font-bold dark:border-neutral-500 print:p-1
            ${headerClassName}`}
          key={name}
          role="columnheader"
        >
          <Button.LikeLink onClick={(): void => handleSort(name as FIELD_NAME)}>
            {label}
            <SortIndicator fieldName={name} sortConfig={sortConfig} />
          </Button.LikeLink>
        </div>
      ))}
    </>
  );
  return (
    <GenericSortedDataViewer<DATA>
      data={data}
      headerElement={elementHeaders}
      getLink={getLink}
      headers={headers}
    />
  );
}

export function GenericSortedDataViewer<
  DATA extends SchemaViewerRow<RR<string, SchemaViewerValue>>
>({
  headers,
  data,
  forwardRef,
  getLink,
  className = '',
  headerElement,
}: {
  readonly headers: RR<string, JSX.Element | LocalizedString>;
  readonly headerElement?: JSX.Element;
  readonly data: RA<DATA>;
  readonly getLink: ((row: DATA) => string) | undefined;
  readonly className?: string | undefined;
  readonly forwardRef?: React.RefObject<HTMLDivElement>;
}): JSX.Element {
  const indexColumn = Object.keys(headers)[0];

  return (
    <div
      className={`
        grid-table
        w-fit flex-1 grid-cols-[repeat(var(--cols),auto)] rounded border border-gray-400 dark:border-neutral-500 print:p-1
        ${className}
      `}
      ref={forwardRef}
      role="table"
      style={{ '--cols': Object.keys(headers).length } as React.CSSProperties}
    >
      <div role="row">{headerElement}</div>
      <div role="rowgroup">
        {data.map((row, index) => {
          const children = Object.keys(headers).map((column) => {
            const data = row[column];
            return (
              <Cell key={column}>
                {Array.isArray(data) ? data[1] : row[column]}
              </Cell>
            );
          });
          const key = `${row[indexColumn]?.toString()}-${index}`;
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
  className,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}): JSX.Element {
  return (
    <div
      className={`border border-gray-400 p-2 dark:border-neutral-500 print:p-1 ${
        className ?? ''
      }`}
      role="cell"
    >
      {children}
    </div>
  );
}
