import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { wbPlanText } from '../../localization/wbPlan';
import { icons } from '../Atoms/Icons';
import { TableIcon } from '../Molecules/TableIcon';
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
      const tableIconUrl = mappings?.mappedHeaders?.[physicalCol];
      const isMapped = tableIconUrl !== undefined;
      const mappingCol = physicalColToMappingCol(physicalCol);
      const tableName =
        (typeof mappingCol === 'number'
          ? mappings?.tableNames[mappingCol]
          : undefined) ?? tableIconUrl?.split('/').at(-1)?.split('.')[0];

      return ReactDOMServer.renderToString(
        <ColumnHeader
          columnName={dataset.columns[physicalCol]}
          isMapped={isMapped}
          tableName={tableName}
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

  return {
    autoWrapCol,
    autoWrapRow,
    columns,
    enterMoves,
    colHeaders,
    enterBeginsEditing,
    hiddenRows,
    hiddenColumns,
    minSpareRows,
    tabMoves,
    comments,
  };
}

function ColumnHeader({
  isMapped,
  columnName,
  tableName,
}: {
  readonly isMapped: boolean;
  readonly columnName: string;
  readonly tableName: string | undefined;
}): JSX.Element {
  return (
    <div className="flex items-center gap-1 pl-4">
      {isMapped && tableName !== undefined ? (
        <TableIcon label={false} name={tableName} />
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
