import Handsontable from 'handsontable';
import type { Plugins } from 'handsontable/plugins';
import type { CellProperties } from 'handsontable/settings';

import { getCache } from '../../utils/cache';
import type { WritableArray } from '../../utils/types';
import { writable } from '../../utils/types';
import { schema } from '../DataModel/schema';
import { userPreferences } from '../Preferences/userPreferences';
import type { Dataset } from '../WbPlanView/Wrapped';
import {
  formatAttachmentsFromCell,
  getAttachmentsColumn,
} from '../WorkBench/attachmentHelpers';
import type { BatchEditPack } from './batchEditHelpers';
import { BATCH_EDIT_KEY, isBatchEditNullRecord } from './batchEditHelpers';
import { getPhysicalColToMappingCol } from './hotHelpers';
import type { WbMapping } from './mapping';
import type { WbPickLists } from './pickLists';

export function configureHandsontable(
  hot: Handsontable,
  mappings: WbMapping | undefined,
  dataset: Dataset,
  pickLists: WbPickLists
): void {
  identifyDefaultValues(hot, mappings);
  curryCells(hot, mappings, dataset, pickLists);
  setColumnWidths(hot, dataset);
  setSort(hot, dataset);
}

export function identifyDefaultValues(
  hot: Handsontable,
  mappings: WbMapping | undefined
): void {
  if (mappings === undefined) return;
  const existingColumns = hot.getSettings()
    .columns as readonly Handsontable.ColumnSettings[];
  hot.updateSettings({
    columns: (index) => ({
      ...existingColumns?.[index],
      placeholder: mappings.defaultValues[index],
    }),
  });
}

type GetProperty = (
  physicalRow: number,
  physicalCol: number,
  _property: number | string
) => Partial<CellProperties>;

function curryCells(
  hot: Handsontable,
  mappings: WbMapping | undefined,
  dataset: Dataset,
  pickLists: WbPickLists
): void {
  const identifyPickLists = getPickListsIdentifier(pickLists);
  const identifyNullRecords = getIdentifyNullRecords(hot, mappings, dataset);
  const identifyAttachments = getAttachmentsIdentifier(dataset);
  hot.updateSettings({
    cells: (physicalRow, physicalColumn, property) => {
      const pickListsResults =
        identifyPickLists?.(physicalRow, physicalColumn, property) ?? {};
      const attachmentsResults =
        identifyAttachments?.(physicalRow, physicalColumn, property) ?? {};
      const nullRecordsResults =
        dataset.uploadresult?.success === true
          ? {}
          : (identifyNullRecords?.(physicalRow, physicalColumn, property) ??
            {});
      return {
        ...pickListsResults,
        ...attachmentsResults,
        ...nullRecordsResults,
      };
    },
  });
}

function getPickListsIdentifier(
  pickLists: WbPickLists
): GetProperty | undefined {
  const callback: GetProperty = (_physicalRow, physicalCol, _property) =>
    physicalCol in pickLists
      ? {
          type: 'autocomplete',
          source: writable(pickLists[physicalCol].items),
          strict: pickLists[physicalCol].readOnly,
          allowInvalid: true,
          filter:
            userPreferences.get('workBench', 'editor', 'filterPickLists') ===
            'none',
          filteringCaseSensitive:
            userPreferences.get('workBench', 'editor', 'filterPickLists') ===
            'case-sensitive',
          sortByRelevance: false,
          trimDropdown: false,
        }
      : { type: 'text' };
  return callback;
}

function getIdentifyNullRecords(
  hot: Handsontable,
  mappings: WbMapping | undefined,
  dataset: Dataset
): GetProperty | undefined {
  if (!dataset.isupdate || mappings === undefined) return undefined;
  const makeNullRecordsReadOnly: GetProperty = (
    physicalRow,
    physicalCol,
    _property
  ) => {
    const physicalColToMappingCol = getPhysicalColToMappingCol(
      mappings,
      dataset
    );
    const mappingCol = physicalColToMappingCol(physicalCol);
    if (mappingCol === -1 || mappingCol === undefined) {
      // Definitely don't need to anything, not even mapped
      return { readOnly: true };
    }

    const batchEditRaw: string | undefined =
      hot.getDataAtRow(hot.toVisualRow(physicalRow)).at(-1) ?? undefined;
    if (
      batchEditRaw === undefined ||
      // Will happen for new rows + rows auto-added at the bottom.
      batchEditRaw.trim() === ''
    ) {
      return { readOnly: false };
    }
    const batchEditPack: BatchEditPack | undefined =
      JSON.parse(batchEditRaw)[BATCH_EDIT_KEY];
    return {
      readOnly: isBatchEditNullRecord(
        batchEditPack,
        mappings.lines[mappingCol].mappingPath
      ),
    };
  };
  return makeNullRecordsReadOnly;
}

function getAttachmentsIdentifier(dataset: Dataset): GetProperty | undefined {
  const attachmentsColumnIndex = getAttachmentsColumn(dataset);
  const callback: GetProperty = (_physicalRow, physicalCol, _property) =>
    physicalCol === attachmentsColumnIndex
      ? {
          renderer: (
            instance,
            td,
            row,
            col,
            property,
            value,
            ...rest
          ): void => {
            const formattedValue = formatAttachmentsFromCell(value);
            const cellMeta = instance.getCellMeta(row, col);
            cellMeta.formattedValue = formattedValue;

            Handsontable.renderers.TextRenderer(
              instance,
              td,
              row,
              col,
              property,
              formattedValue,
              ...rest
            );
          },
          readOnly: true,
        }
      : {};
  return callback;
}

function setSort(hot: Handsontable, dataset: Dataset): void {
  const sortConfig = getCache(
    'workBenchSortConfig',
    `${schema.domainLevelIds.collection}_${dataset.id}`
  );
  if (!Array.isArray(sortConfig)) return;
  const visualSortConfig = sortConfig.map(({ physicalCol, ...rest }) => ({
    ...rest,
    column: hot.toVisualColumn(physicalCol),
  }));
  getHotPlugin(hot, 'multiColumnSorting').sort(visualSortConfig);
}

/**
 * Cached retrieved HOT plugins
 * This improved performance in earlier versions
 * REFACTOR: check if this is still necessary
 */
const hotPlugins = new WeakMap<
  Handsontable,
  // eslint-disable-next-line functional/prefer-readonly-type
  {
    [key in keyof Plugins]?: Plugins[key] | undefined;
  }
>();

export function getHotPlugin<NAME extends keyof Plugins>(
  hot: Handsontable,
  pluginName: NAME
): Plugins[NAME] {
  let plugins = hotPlugins.get(hot);
  if (plugins === undefined) {
    plugins = {};
    hotPlugins.set(hot, plugins);
  }
  if (plugins[pluginName] === undefined)
    plugins[pluginName] = hot.getPlugin(pluginName);
  return plugins[pluginName]!;
}

function setColumnWidths(hot: Handsontable, dataset: Dataset): void {
  let colWidths: WritableArray<number> | undefined = undefined;
  /**
   * The attachments column contains text that is different from what is actually displayed.
   * For simplicity, the width is limited to 100px to reflect the likely shorter displayed text.
   */
  const attachmentColumnMaxWidth = 100;
  const attachmentsColumnIndex = getAttachmentsColumn(dataset);
  if (attachmentsColumnIndex !== -1) {
    colWidths = [];
    colWidths[attachmentsColumnIndex] = Math.min(
      hot.getColWidth(attachmentsColumnIndex),
      attachmentColumnMaxWidth
    );
  }
  hot.updateSettings({
    colWidths,
  });
}
