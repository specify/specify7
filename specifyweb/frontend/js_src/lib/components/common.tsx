import React from 'react';

import icons from '../icons';
import commonText from '../localization/common';
import { spanNumber } from '../wbplanviewhelper';
import dataModelStorage from '../wbplanviewmodel';

const MAX_HUE = 360;
const getHue = spanNumber(
  'a'.charCodeAt(0) * 2,
  'z'.charCodeAt(0) * 2,
  0,
  MAX_HUE
);

export function TableIcon({
  tableName,
  tableLabel,
}: {
  readonly tableName: string;
  readonly tableLabel?: string | false;
}): JSX.Element {
  const tableIconSource = icons.getIcon(tableName);
  const resolvedTableLabel =
    tableLabel === false
      ? ''
      : tableLabel ?? dataModelStorage.tables[tableName]?.label ?? '';
  if (tableIconSource !== '/images/unknown.png')
    return (
      <span
        className="table-icon table-icon-image"
        role="img"
        style={{ backgroundImage: `url('${tableIconSource}')` }}
        title={resolvedTableLabel}
        aria-label={resolvedTableLabel}
      />
    );

  const colorHue = getHue(tableName.charCodeAt(0) + tableName.charCodeAt(0));
  const color = `hsl(${colorHue}, 70%, 50%)`;
  return (
    <span
      style={{ backgroundColor: color }}
      role="img"
      className="table-icon table-icon-generated"
      title={resolvedTableLabel}
      aria-label={resolvedTableLabel}
    >
      {tableName.slice(0, 2).toUpperCase()}
    </span>
  );
}

export const TableIconUndefined = (
  <span
    className="table-icon table-icon-undefined"
    aria-label={commonText('unmapped')}
    role="img"
  >
    ⃠
  </span>
);

export const TableIconSelected = (
  <span
    className="table-icon table-icon-selected"
    aria-label={commonText('unmapped')}
    role="img"
  >
    ✓
  </span>
);

export const TableIconEmpty = (
  <span className="table-icon table-icon-empty" aria-hidden={true} />
);

export function DateElement({
  date,
  fallback = undefined,
}: {
  readonly date: string | undefined;
  readonly fallback?: React.ReactNode;
}): JSX.Element {
  if (typeof date !== 'string' || Number.isNaN(Date.parse(date)))
    return <>{fallback}</>;
  const dateObject = new Date(date);
  return (
    <time
      dateTime={dateObject.toISOString()}
      title={dateObject.toLocaleString()}
    >
      {dateObject.toDateString()}
    </time>
  );
}
