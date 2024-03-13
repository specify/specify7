/**
 * Component for the Handsontable React wrapper
 *
 * TODO:
 * - Add context menu settings
 * - Upgrade to handsontable14 to fix copyPasteEnabled error
 */

import { HotTable } from '@handsontable/react';
import React from 'react';

import { LANGUAGE } from '../../localization/utils/config';
import { wbPlanText } from '../../localization/wbPlan';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { legacyNonJsxIcons } from '../Atoms/Icons';
import { getTable } from '../DataModel/tables';
import { hasPermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import type { Dataset } from '../WbPlanView/Wrapped';
import { parseWbMappings } from './mapping';

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

  const physicalColToMappingCol = (physicalCol: number): number | undefined =>
    mappings?.lines.findIndex(
      ({ headerName }) => headerName === dataset.columns[physicalCol]
    );

  return (
    <HotTable
      autoWrapCol={userPreferences.get('workBench', 'editor', 'autoWrapCol')}
      autoWrapRow={userPreferences.get('workBench', 'editor', 'autoWrapRow')}
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
      columns={Array.from(
        // Last column is invisible and contains disambiguation metadata
        { length: dataset.columns.length + 1 },
        (_, physicalCol) => ({
          // Get data from nth column for nth column
          data: physicalCol,
        })
      )}
      commentedCellClassName="htCommentCell"
      comments={{
        displayDelay: 100,
      }}
      data={data as (string | null)[][]}
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
      invalidCellClassName="-"
      language={LANGUAGE}
      licenseKey="non-commercial-and-evaluation"
      manualColumnMove={true}
      manualColumnResize={true}
      minSpareRows={userPreferences.get('workBench', 'editor', 'minSpareRows')}
      multiColumnSorting={true}
      outsideClickDeselects={false}
      placeholderCellClassName="htPlaceholder"
      ref={hotRef}
      rowHeaders={true}
      sortIndicator={true}
      stretchH="all"
      tabMoves={
        userPreferences.get('workBench', 'editor', 'tabMoveDirection') === 'col'
          ? { col: 1, row: 0 }
          : { col: 0, row: 1 }
      }
      readOnly={isUploaded || !hasPermission('/workbench/dataset', 'update')}
      // ContextMenu={contextMenuConfig as Settings}
    />
  );
}
