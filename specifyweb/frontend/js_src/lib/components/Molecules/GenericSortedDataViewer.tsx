import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import type { RA, RR } from '../../utils/types';
import { Link } from '../Atoms/Link';
import type {
  SchemaViewerRow,
  SchemaViewerValue,
} from '../SchemaViewer/helpers';

export function GenericSortedDataViewer<
  DATA extends SchemaViewerRow<RR<string, SchemaViewerValue>>,
>({
  headers,
  data,
  getLink,
  className = '',
  headerClassName = '',
  cellClassName,
}: {
  readonly headers: RR<string, JSX.Element | LocalizedString>;
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
      className={`grid-table flex-1 grid-cols-[repeat(var(--cols),auto)] 
       rounded print:p-1 ${className}`}
      role="table"
      style={{ '--cols': Object.keys(headers).length } as React.CSSProperties}
    >
      <div role="row">
        {Object.entries(headers).map(([name, element]) => (
          <div
            className={`
            sticky top-0 border-gray-400 bg-[color:var(--background)]
            p-2 font-bold dark:border-neutral-500 print:p-1
            ${headerClassName}`}
            key={name}
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
          const indexValue = row[indexColumn];
          const key =
            typeof indexValue === 'object' ? indexValue[0] : indexValue;
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
