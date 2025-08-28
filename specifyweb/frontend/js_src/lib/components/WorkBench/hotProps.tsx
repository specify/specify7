import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { attachmentsText } from '../../localization/attachments';
import { wbPlanText } from '../../localization/wbPlan';
import type { RA, WritableArray } from '../../utils/types';
import { icons } from '../Atoms/Icons';
import { ReadOnlyContext } from '../Core/Contexts';
import { getIcon } from '../InitialContext/icons';
import { TableIcon } from '../Molecules/TableIcon';
import { userPreferences } from '../Preferences/userPreferences';
import type { Dataset } from '../WbPlanView/Wrapped';
import { getAttachmentsColumn } from '../WorkBench/attachmentHelpers';
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
  const isReadOnly = React.useContext(ReadOnlyContext);
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
          readOnly:
            isReadOnly ||
            [-1, undefined].includes(physicalColToMappingCol(physicalCol)),
        })
      ),
    [dataset.columns.length, isReadOnly]
  );

  const [enterMovesPref] = userPreferences.use(
    'workBench',
    'editor',
    'enterMoveDirection'
  );
  const enterMoves =
    enterMovesPref === 'col' ? { col: 1, row: 0 } : { col: 0, row: 1 };

  const attachmentsColumnIndex = getAttachmentsColumn(dataset);

  const colHeaders = React.useCallback(
    (physicalCol: number) => {
      const isAttachmentsColumn = physicalCol === attachmentsColumnIndex;
      const columnName = isAttachmentsColumn
        ? attachmentsText.attachments()
        : dataset.columns[physicalCol];
      const tableIconUrl = isAttachmentsColumn
        ? getIcon('Attachment')
        : mappings?.mappedHeaders?.[physicalCol];
      const isMapped = tableIconUrl !== undefined;
      const mappingCol = physicalColToMappingCol(physicalCol);
      const tableName =
        (typeof mappingCol === 'number'
          ? mappings?.tableNames[mappingCol]
          : undefined) ?? tableIconUrl?.split('/').at(-1)?.split('.')[0];

      return ReactDOMServer.renderToString(
        <ColumnHeader
          columnName={columnName}
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
    () => {
      return {
      // Hide the disambiguation column
      columns: [dataset.columns.length],
      indicators: false,
      // TODO: Typing possibly doesn't match for handsontable 12.1.0, fixed in 14
      copyPasteEnabled: false,
      }},
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
