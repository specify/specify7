import { backEndText } from '../../localization/backEnd';
import { f } from '../../utils/functools';
import type { RA, WritableArray } from '../../utils/types';
import { SET, throttle } from '../../utils/utils';
import { getHotPlugin } from './handsontable';
import type { Workbench } from './WbView';

const metaKeys = [
  'isNew',
  'isModified',
  'isSearchResult',
  'issues',
  'originalValue',
  'isUpdated',
  'isDeleted',
  'isMatchedAndChanged'
] as const;

export type WbMeta = {
  readonly isNew: boolean;
  readonly isModified: boolean;
  readonly isSearchResult: boolean;
  readonly issues: RA<string>;
  readonly originalValue: string | undefined;
  readonly isUpdated: boolean;
  readonly isDeleted: boolean;
  readonly isMatchedAndChanged: boolean;
};

export type WbCellCounts = {
  readonly newCells: number;
  readonly invalidCells: number;
  readonly searchResults: number;
  readonly modifiedCells: number;
  readonly updatedCells: number;
  readonly deletedCells: number;
  readonly matchedAndChangedCells: number;
};

// REFACTOR: replace usages of WbMetaArray with WbMeta and test performance/memory
// eslint-disable-next-line functional/prefer-readonly-type
export type WbMetaArray = [
  isNew: boolean,
  isModified: boolean,
  isSearchResult: boolean,
  issues: RA<string>,
  originalValue: string | undefined,
  isUpdated: boolean,
  isDeleted: boolean,
  isMatchedAndChanged: boolean
];

const defaultMetaValues = Object.freeze([
  false,
  false,
  false,
  Object.freeze([]),
  undefined,
  false,
  false,
  false
] as const);

/* eslint-disable functional/no-this-expression */
export class WbCellMeta {
  // Meta data for each cell (indexed by physical columns)
  // eslint-disable-next-line functional/prefer-readonly-type
  public cellMeta: WritableArray<WritableArray<WbMetaArray>> = [];

  // Meta data for each cell (indexed by visual columns)
  // eslint-disable-next-line functional/prefer-readonly-type
  public indexedCellMeta: RA<RA<WbMetaArray>> | undefined = undefined;

  public constructor(private readonly workbench: Workbench) {
    this.updateCellInfoStats = throttle(
      this.updateCellInfoStats.bind(this),
      this.workbench.throttleRate
    );
  }

  public getCellMeta<KEY extends keyof WbMeta>(
    physicalRow: number,
    physicalCol: number,
    key: KEY
  ): WbMeta[KEY] {
    const index = metaKeys.indexOf(key);
    return (this.cellMeta[physicalRow]?.[physicalCol]?.[index] ??
      defaultMetaValues[index]) as unknown as WbMeta[KEY];
  }

  public getCellMetaFromArray<KEY extends keyof WbMeta>(
    metaCell: WbMetaArray,
    key: KEY
  ): WbMeta[KEY] {
    const index = metaKeys.indexOf(key);
    return (metaCell?.[index] ?? defaultMetaValues[index]) as WbMeta[KEY];
  }

  /*
   * This does not run visual side effects
   * For changing meta with side effects, use this.updateCellMeta
   */
  public setCellMeta<KEY extends keyof WbMeta>(
    physicalRow: number,
    physicalCol: number,
    key: KEY,
    value: WbMeta[KEY]
  ) {
    const currentValue = this.getCellMeta(physicalRow, physicalCol, key);
    const issuesChanged =
      key === 'issues' &&
      ((currentValue as RA<string>).length !== (value as RA<string>).length ||
        JSON.stringify(currentValue) !== JSON.stringify(value));
    const cellValueChanged = key === 'originalValue';
    const metaValueChanged =
      issuesChanged ||
      cellValueChanged ||
      (['isNew', 'isModified', 'isSearchResult', 'isUpdated', 'isDeleted', 'isMatchedAndChanged'].includes(key) &&
        currentValue !== value);

    if (!metaValueChanged) return false;

    const index = metaKeys.indexOf(key);
    this.cellMeta[physicalRow] ??= [];
    this.cellMeta[physicalRow][physicalCol] ??= Array.from(
      defaultMetaValues
    ) as unknown as WbMetaArray;
    this.cellMeta[physicalRow][physicalCol][index] = value;

    this.indexedCellMeta = undefined;

    return true;
  }

  /**
   * Figuring out if a cell was modified is more complicated then it might seem
   */
  private isCellModified(physicalRow: number, physicalCol: number): boolean {
    // For now, only readOnly picklists are validated on the front-end
    const hasFrontEndValidationErrors = this.getCellMeta(
      physicalRow,
      physicalCol,
      'issues'
    ).some((issue) =>
      issue.endsWith(backEndText.failedParsingPickList({ value: '' }))
    );
    if (hasFrontEndValidationErrors)
      /*
       * Since isModified state has higher priority then issues, we need to
       * remove the isModified state if front end validation errors are to be
       * visible
       */
      return false;

    const originalCellValue = this.getCellMeta(
      physicalRow,
      physicalCol,
      'originalValue'
    );
    const cellValueChanged =
      originalCellValue !== undefined &&
      (originalCellValue?.toString() ?? '') !==
        (this.workbench.data[physicalRow][physicalCol]?.toString() ?? '');
    if (cellValueChanged) return true;

    /*
     * If cell was disambiguated, it should show up as changed, even if value
     * is unchanged
     */
    return this.workbench.disambiguation?.cellWasDisambiguated(
      physicalRow,
      physicalCol
    );
  }

  /**
   * Updates cell's isModified meta state
   */
  public recalculateIsModifiedState(
    physicalRow: number,
    physicalCol: number,
    visualIndexes: {
      readonly visualRow?: number;
      readonly visualCol?: number;
    } = {}
  ): void {
    const isModified = this.isCellModified(physicalRow, physicalCol);
    this.updateCellMeta(
      physicalRow,
      physicalCol,
      'isModified',
      isModified,
      visualIndexes
    );
  }

  /**
   * Note: "cell" is undefined when setting meta for off-screen cell.
   * This is the case when rendering off-screen issues (which don't require a cell
   * reference)
   */
  public runMetaUpdateEffects<KEY extends keyof WbMeta>(
    cell: HTMLTableCellElement | undefined,
    key: KEY,
    value: WbMeta[KEY],
    visualRow: number,
    visualCol: number
  ) {
    if (this.workbench.hot === undefined) return;

    if (key === 'isNew')
      cell?.classList[value === true ? 'add' : 'remove']('wb-no-match-cell');
    else if (key === 'isUpdated')
      cell?.classList[value === true ? 'add' : 'remove']('wb-updated-cell');
    else if (key === 'isDeleted')
      cell?.classList[value === true ? 'add' : 'remove']('wb-deleted-cell');
    else if (key === 'isModified')
      cell?.classList[value === true ? 'add' : 'remove']('wb-modified-cell');
    else if (key === 'isMatchedAndChanged')
      cell?.classList[value === true ? 'add' : 'remove']('wb-matched-and-changed-cell');
    else if (key === 'isSearchResult')
      cell?.classList[value === true ? 'add' : 'remove'](
        'wb-search-match-cell'
      );
    else if (key === 'issues') {
      const issues = value as RA<string>;
      if (issues.length === 0)
        getHotPlugin(this.workbench.hot, 'comments').removeCommentAtCell(
          visualRow,
          visualCol
        );
      else {
        getHotPlugin(this.workbench.hot, 'comments').setCommentAtCell(
          visualRow,
          visualCol,
          issues.join('\n')
        );
        getHotPlugin(this.workbench.hot, 'comments').updateCommentMeta(
          visualRow,
          visualCol,
          {
            readOnly: true,
          }
        );
      }
    } else
      throw new Error(
        `Tried to set unknown metaData record ${key}=${JSON.stringify(
          value
        )} for cell
         ${visualRow}x${visualCol}`
      );
  }

  public updateCellMeta<KEY extends keyof WbMeta>(
    physicalRow: number,
    physicalCol: number,
    key: KEY,
    value: WbMeta[KEY],
    {
      // Can optionally provide this to improve performance
      cell: initialCell = undefined,
      // Can optionally provide this to improve performance
      visualRow: initialVisualRow = undefined,
      // Can optionally provide this to improve performance
      visualCol: initialVisualCol = undefined,
    }: {
      readonly cell?: HTMLTableCellElement;
      readonly visualRow?: number;
      readonly visualCol?: number;
    } = {}
  ) {
    if (this.workbench.hot === undefined) return;
    const isValueChanged = this.setCellMeta(
      physicalRow,
      physicalCol,
      key,
      value
    );
    if (!isValueChanged) return false;

    const visualRow =
      initialVisualRow ?? this.workbench.hot.toVisualRow(physicalRow);
    const visualCol =
      initialVisualCol ?? this.workbench.hot.toVisualColumn(physicalCol);
    const cell =
      initialCell ?? this.workbench.hot.getCell(visualRow, visualCol);
    this.runMetaUpdateEffects(
      cell ?? undefined,
      key,
      value,
      visualRow,
      visualCol
    );

    return true;
  }

  /*
   * Returns this.cellMeta, but instead of indexing by physical row/col,
   * indexes by visual row/col
   *
   * This is used for navigation among cells.
   *
   * Also, if navigation direction is set to ColByCol, the resulting array
   * is transposed.
   *
   * this.indexedCellMeta is set to undefined whenever visual indexes change
   *
   */
  public getCellMetaObject(): RA<RA<WbMetaArray>> {
    if (this.indexedCellMeta === undefined) {
      if (this.workbench.hot === undefined) return [];
      const resolveIndex = (
        visualRow: number,
        visualCol: number,
        first: boolean
      ) =>
        (this.workbench.utils.searchPreferences.navigation.direction ===
          'rowFirst') ===
        first
          ? visualRow
          : visualCol;

      const indexedCellMeta: WritableArray<WritableArray<WbMetaArray>> = [];
      Object.entries(this.cellMeta).forEach(([physicalRow, metaRow]) =>
        Object.entries(metaRow).forEach(([physicalCol, cellMeta]) => {
          const visualRow = this.workbench.hot!.toVisualRow(
            f.fastParseInt(physicalRow)
          );
          const visualCol = this.workbench.hot!.toVisualColumn(
            f.fastParseInt(physicalCol)
          );
          indexedCellMeta[resolveIndex(visualRow, visualCol, true)] ??= [];
          indexedCellMeta[resolveIndex(visualRow, visualCol, true)][
            resolveIndex(visualRow, visualCol, false)
          ] = cellMeta;
        })
      );
      this.indexedCellMeta = indexedCellMeta;
    }
    return this.indexedCellMeta;
  }

  // MetaData
  public updateCellInfoStats() {
    const cellMeta = this.cellMeta.flat();

    this.workbench.cellCounts[SET]({
      newCells: cellMeta.reduce(
        (count, info) =>
          count + (this.getCellMetaFromArray(info, 'isNew') ? 1 : 0),
        0
      ),
      invalidCells: cellMeta.reduce(
        (count, info) =>
          count +
          (this.getCellMetaFromArray(info, 'issues').length > 0 ? 1 : 0),
        0
      ),
      searchResults: cellMeta.reduce(
        (count, info) =>
          count + (this.getCellMetaFromArray(info, 'isSearchResult') ? 1 : 0),
        0
      ),
      modifiedCells: cellMeta.reduce(
        (count, info) =>
          count + (this.getCellMetaFromArray(info, 'isModified') ? 1 : 0),
        0
      ),
      updatedCells: cellMeta.reduce(
        (count, info)=>count + (this.getCellMetaFromArray(info, 'isUpdated') ? 1 : 0), 0
      ),
      deletedCells: cellMeta.reduce(
        (count, info)=>count + (this.getCellMetaFromArray(info, 'isDeleted') ? 1 : 0), 0
      ),
      matchedAndChangedCells: cellMeta.reduce(
        (count, info)=>count + (this.getCellMetaFromArray(info, 'isMatchedAndChanged') ? 1 : 0), 0
      )
    });
  }

  public cellIsType(metaArray: WbMetaArray, type: keyof WbCellCounts): boolean {
    switch (type) {
      case 'invalidCells': {
        return this.getCellMetaFromArray(metaArray, 'issues').length > 0;
      }
      case 'newCells': {
        return this.getCellMetaFromArray(metaArray, 'isNew');
      }
      case 'modifiedCells': {
        return this.getCellMetaFromArray(metaArray, 'isModified');
      }
      case 'searchResults': {
        return this.getCellMetaFromArray(metaArray, 'isSearchResult');
      }
      case 'updatedCells': {
        return this.getCellMetaFromArray(metaArray, 'isUpdated');
      }
      case 'deletedCells': {
        return this.getCellMetaFromArray(metaArray, 'isDeleted');
      }
      case 'matchedAndChangedCells':
        return this.getCellMetaFromArray(metaArray, 'isMatchedAndChanged');
      default: {
        return false;
      }
    }
  }

  public isResultCell(metaArray: WbMetaArray): boolean {
    return this.cellIsType(metaArray, 'newCells') || 
      this.cellIsType(metaArray, 'updatedCells') || 
        this.cellIsType(metaArray, 'deletedCells') || 
          this.cellIsType(metaArray, 'matchedAndChangedCells')
  }
}
/* eslint-enable functional/no-this-expression */
