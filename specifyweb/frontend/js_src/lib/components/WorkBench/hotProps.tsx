import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { wbPlanText } from '../../localization/wbPlan';
import { f } from '../../utils/functools';
import { icons } from '../Atoms/Icons';
import { getTable } from '../DataModel/tables';
import { userPreferences } from '../Preferences/userPreferences';
import type { Dataset } from '../WbPlanView/Wrapped';
import type { WbMapping } from './mapping';

const comments = { displayDelay: 100 };

const hiddenRows = {
  rows: [],
  indicators: false,
  // TODO: Typing possibly doesn't match for handsontable 12.1.0, fixed in 14
  copyPasteEnabled: false,
};

export function useHotProps({
  dataset,
  mappings,
  physicalColToMappingCol,
}: {
  readonly dataset: Dataset;
  readonly mappings: WbMapping | undefined;
  readonly physicalColToMappingCol: (physicalCol: number) => number | undefined;
}) {
  const [autoWrapCol] = userPreferences.use(
    'workBench',
    'editor',
    'autoWrapCol'
  );

  const [autoWrapRow] = userPreferences.use(
    'workBench',
    'editor',
    'autoWrapRow'
  );

  const columns = React.useMemo(
    () =>
      Array.from(
        // Last column is invisible and contains disambiguation metadata
        { length: dataset.columns.length + 1 },
        (_, physicalCol) => ({
          // Get data from nth column for nth column
          data: physicalCol,
          readOnly: [-1, undefined].includes(
            physicalColToMappingCol(physicalCol)
          ),
        })
      ),
    [dataset.columns.length]
  );

  const [enterMovesPref] = userPreferences.use(
    'workBench',
    'editor',
    'enterMoveDirection'
  );
  const enterMoves =
    enterMovesPref === 'col' ? { col: 1, row: 0 } : { col: 0, row: 1 };

  const colHeaders = React.useCallback(
    (physicalCol: number) => {
      const tableIcon = mappings?.mappedHeaders?.[physicalCol];
      const isMapped = tableIcon !== undefined;
      const mappingCol = physicalColToMappingCol(physicalCol);
      const tableName =
        (typeof mappingCol === 'number'
          ? mappings?.tableNames[mappingCol]
          : undefined) ?? tableIcon?.split('/').slice(-1)?.[0]?.split('.')?.[0];
      const tableLabel = isMapped
        ? f.maybe(tableName, getTable)?.label ?? tableName ?? ''
        : '';
      // REFACTOR: use new table icons
      return ReactDOMServer.renderToString(
        <ColumnHeader
          columnName={dataset.columns[physicalCol]}
          isMapped={isMapped}
          tableIcon={tableIcon}
          tableLabel={tableLabel}
        />
      );
    },
    [mappings]
  );

  const [enterBeginsEditing] = userPreferences.use(
    'workBench',
    'editor',
    'enterBeginsEditing'
  );

  const hiddenColumns = React.useMemo(
    () => ({
      // Hide the disambiguation column
      columns: [dataset.columns.length],
      indicators: false,
      // TODO: Typing possibly doesn't match for handsontable 12.1.0, fixed in 14
      copyPasteEnabled: false,
    }),
    []
  );

  const [minSpareRows] = userPreferences.use(
    'workBench',
    'editor',
    'minSpareRows'
  );

  const [tabMovesPref] = userPreferences.use(
    'workBench',
    'editor',
    'tabMoveDirection'
  );
  const tabMoves =
    tabMovesPref === 'col' ? { col: 1, row: 0 } : { col: 0, row: 1 };

  const adjustedMinRows = dataset.isupdate ? 0 : minSpareRows;
  return {
    autoWrapCol,
    autoWrapRow,
    columns,
    enterMoves,
    colHeaders,
    enterBeginsEditing,
    hiddenRows,
    hiddenColumns,
    minSpareRows: adjustedMinRows,
    tabMoves,
    comments,
  };
}

function ColumnHeader({
  isMapped,
  tableLabel,
  tableIcon,
  columnName,
}: {
  readonly isMapped: boolean;
  readonly tableLabel: string;
  readonly tableIcon: string | undefined;
  readonly columnName: string;
}): JSX.Element {
  return (
    <div className="flex items-center gap-1 pl-4">
      {isMapped ? (
        <img
          alt={tableLabel}
          className="w-table-icon h-table-icon"
          src={tableIcon}
        />
      ) : (
        <span
          aria-label={wbPlanText.unmappedColumn()}
          className="text-red-600"
          title={wbPlanText.unmappedColumn()}
        >
          {icons.ban}
        </span>
      )}
      <span className="wb-header-name columnSorting">{columnName}</span>
    </div>
  );
}
