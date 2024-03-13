/**
 * Component for the Handsontable React wrapper
 *
 * TODO:
 * - Add context menu settings
 * - Upgrade to handsontable14 to fix copyPasteEnabled error
 */

import { HotTable } from '@handsontable/react';
import React from 'react';

import type { Dataset } from '../WbPlanView/Wrapped';
import type { RA } from '../../utils/types';
import { f } from '../../utils/functools';
import { LANGUAGE } from '../../localization/utils/config';
import { wbPlanText } from '../../localization/wbPlan';
import { userPreferences } from '../Preferences/userPreferences';
import { hasPermission } from '../Permissions/helpers';
import { parseWbMappings } from './mapping';
import { getTable } from '../DataModel/tables';
import { legacyNonJsxIcons } from '../Atoms/Icons';

export function WbSpreadsheet({
  dataset,
  hotRef,
  isUploaded,
}: {
  readonly dataset: Dataset;
  readonly hotRef: any;
  readonly isUploaded: boolean;
}): JSX.Element {
  const data = React.useMemo<RA<RA<string | null>>>(
    () =>
      dataset.rows.length === 0
        ? [Array.from(dataset.columns).fill(null)]
        : dataset.rows,
    [dataset.rows]
  );
  const mappings = parseWbMappings(dataset);

  const physicalColToMappingCol = (physicalCol: number): number | undefined => {
    return mappings?.lines.findIndex(
      ({ headerName }) => headerName === dataset.columns[physicalCol]
    );
  };

  return (
    <>
      <HotTable
        ref={hotRef}
        data={data as (string | null)[][]}
        columns={Array.from(
          // Last column is invisible and contains disambiguation metadata
          { length: dataset.columns.length + 1 },
          (_, physicalCol) => ({
            // Get data from nth column for nth column
            data: physicalCol,
          })
        )}
        colHeaders={(physicalCol: number) => {
          const tableIcon = mappings?.mappedHeaders?.[physicalCol];
          const isMapped = tableIcon !== undefined;
          const mappingCol = physicalColToMappingCol(physicalCol);
          const tableName =
            (typeof mappingCol === 'number'
              ? mappings?.tableNames[mappingCol]
              : undefined) ??
            tableIcon?.split('/').slice(-1)?.[0]?.split('.')?.[0];
          const tableLabel = isMapped
            ? f.maybe(tableName, getTable)?.label ?? tableName ?? ''
            : '';
          // REFACTOR: use new table icons
          return `<div class="flex gap-1 items-center pl-4">
                  ${
                    isMapped
                      ? `<img
                    class="w-table-icon h-table-icon"
                    alt="${tableLabel}"
                    src="${tableIcon}"
                  >`
                      : `<span
                    class="text-red-600"
                    aria-label="${wbPlanText.unmappedColumn()}"
                    title="${wbPlanText.unmappedColumn()}"
                  >${legacyNonJsxIcons.ban}</span>`
                  }
                  <span class="wb-header-name columnSorting">
                    ${dataset.columns[physicalCol]}
                  </span>
                </div>`;
        }}
        hiddenColumns={{
          // Hide the disambiguation column
          columns: [dataset.columns.length],
          indicators: false,
          // @ts-expect-error Typing doesn't match for handsontable 12.1.0, fixed in 14
          copyPasteEnabled: false,
        }}
        hiddenRows={{
          rows: [],
          indicators: false,
          // Temporarily disabled as copyPasteEnabled throws an error despite having ts-expect-error
          // Typing doesn't match for handsontable 12.1.0, fixed in 14
          // copyPasteEnabled: false,
        }}
        minSpareRows={userPreferences.get(
          'workBench',
          'editor',
          'minSpareRows'
        )}
        comments={{
          displayDelay: 100,
        }}
        commentedCellClassName="htCommentCell"
        placeholderCellClassName="htPlaceholder"
        invalidCellClassName="-"
        rowHeaders={true}
        autoWrapCol={userPreferences.get('workBench', 'editor', 'autoWrapCol')}
        autoWrapRow={userPreferences.get('workBench', 'editor', 'autoWrapRow')}
        enterBeginsEditing={userPreferences.get(
          'workBench',
          'editor',
          'enterBeginsEditing'
        )}
        enterMoves={
          userPreferences.get('workBench', 'editor', 'enterMoveDirection') ===
          'col'
            ? { col: 1, row: 0 }
            : { col: 0, row: 1 }
        }
        tabMoves={
          userPreferences.get('workBench', 'editor', 'tabMoveDirection') ===
          'col'
            ? { col: 1, row: 0 }
            : { col: 0, row: 1 }
        }
        manualColumnResize={true}
        manualColumnMove={true}
        outsideClickDeselects={false}
        multiColumnSorting={true}
        sortIndicator={true}
        language={LANGUAGE}
        licenseKey="non-commercial-and-evaluation"
        stretchH="all"
        readOnly={isUploaded || !hasPermission('/workbench/dataset', 'update')}
        // contextMenu={contextMenuConfig as Settings}
      />
    </>
  );
}
