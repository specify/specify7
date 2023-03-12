import _ from 'underscore';

import { backEndText } from '../../localization/backEnd';
import { wbText } from '../../localization/workbench';
import type { RA, WritableArray } from '../../utils/types';
import { getHotPlugin } from './handsontable';
import type { WbView } from './WbView';

const metaKeys = [
  'isNew',
  'isModified',
  'isSearchResult',
  'issues',
  'originalValue',
] as const;

export type WbMeta = {
  readonly isNew: boolean;
  readonly isModified: boolean;
  readonly isSearchResult: boolean;
  readonly issues: RA<string>;
  readonly originalValue: string | undefined;
};

export type WbCellCounts = {
  readonly newCells: number;
  readonly invalidCells: number;
  readonly searchResults: number;
  readonly modifiedCells: number;
};

// REFACTOR: replace usages of WbMetaArray with WbMeta and test performance/memory
// eslint-disable-next-line functional/prefer-readonly-type
export type WbMetaArray = [
  boolean,
  boolean,
  boolean,
  RA<string>,
  string | undefined
];

const defaultMetaValues = Object.freeze([
  false,
  false,
  false,
  Object.freeze([]),
  undefined,
] as const);

/* eslint-disable functional/no-this-expression */
export class WbCellMeta {
  // Meta data for each cell (indexed by physical columns)
  // eslint-disable-next-line functional/prefer-readonly-type
  public cellMeta: WritableArray<WritableArray<WbMetaArray>> = [];

  // Meta data for each cell (indexed by visual columns)
  // eslint-disable-next-line functional/prefer-readonly-type
  private indexedCellMeta: RA<RA<WbMetaArray>> | undefined = undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  public flushIndexedCellData: boolean = true;

  public constructor(private readonly wbView: WbView) {
    this.updateCellInfoStats = _.throttle(
      this.updateCellInfoStats,
      this.wbView.throttleRate
    );
  }

  getCellMeta<KEY extends keyof WbMeta>(
    physicalRow: number,
    physicalCol: number,
    key: KEY
  ): WbMeta[KEY] {
    const index = metaKeys.indexOf(key);
    return (this.cellMeta[physicalRow]?.[physicalCol]?.[index] ??
      defaultMetaValues[index]) as unknown as WbMeta[KEY];
  }

  getCellMetaFromArray<KEY extends keyof WbMeta>(
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
  setCellMeta<KEY extends keyof WbMeta>(
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
      (['isNew', 'isModified', 'isSearchResult'].includes(key) &&
        currentValue !== value);

    if (!metaValueChanged) return false;

    const index = metaKeys.indexOf(key);
    this.cellMeta[physicalRow] ??= [];
    this.cellMeta[physicalRow][physicalCol] ??= Array.from(
      defaultMetaValues
    ) as unknown as WbMetaArray;
    this.cellMeta[physicalRow][physicalCol][index] = value;

    this.flushIndexedCellData = true;

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
        (this.wbView.data[physicalRow][physicalCol]?.toString() ?? '');
    if (cellValueChanged) return true;

    /*
     * If cell was disambiguated, it should show up as changed, even if value
     * is unchanged
     */
    return this.wbView.disambiguation.cellWasDisambiguated(
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
    {
      // Can optionally provide this to improve performance
      visualRow = undefined,
      // Can optionally provide this to improve performance
      visualCol = undefined,
    }: {
      readonly visualRow?: number;
      readonly visualCol?: number;
    } = {}
  ): void {
    const isModified = this.isCellModified(physicalRow, physicalCol);
    this.updateCellMeta(physicalRow, physicalCol, 'isModified', isModified, {
      visualRow,
      visualCol,
    });
  }

  /**
   * Note: "cell" is undefined when setting meta for off-screen cell.
   * This is the case when rendering off-screen issues (which don't require a cell
   * reference)
   */
  runMetaUpdateEffects<KEY extends keyof WbMeta>(
    cell: HTMLTableCellElement | undefined,
    key: KEY,
    value: WbMeta[KEY],
    visualRow: number,
    visualCol: number
  ) {
    if (this.wbView.hot === undefined) return;

    if (key === 'isNew')
      cell?.classList[value === true ? 'add' : 'remove']('wb-no-match-cell');
    else if (key === 'isModified')
      cell?.classList[value === true ? 'add' : 'remove']('wb-modified-cell');
    else if (key === 'isSearchResult')
      cell?.classList[value === true ? 'add' : 'remove'](
        'wb-search-match-cell'
      );
    else if (key === 'issues') {
      const issues = value as RA<string>;
      if (issues.length === 0)
        getHotPlugin(this.wbView.hot, 'comments').removeCommentAtCell(
          visualRow,
          visualCol
        );
      else {
        getHotPlugin(this.wbView.hot, 'comments').setCommentAtCell(
          visualRow,
          visualCol,
          issues.join('\n')
        );
        getHotPlugin(this.wbView.hot, 'comments').updateCommentMeta(
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

  updateCellMeta<KEY extends keyof WbMeta>(
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
    if (this.wbView.hot === undefined) return;
    const isValueChanged = this.setCellMeta(
      physicalRow,
      physicalCol,
      key,
      value
    );
    if (!isValueChanged) return false;

    const visualRow =
      initialVisualRow ?? this.wbView.hot.toVisualRow(physicalRow);
    const visualCol =
      initialVisualCol ?? this.wbView.hot.toVisualColumn(physicalCol);
    const cell = initialCell ?? this.wbView.hot.getCell(visualRow, visualCol);
    if (typeof cell === 'object' && cell !== null)
      this.runMetaUpdateEffects(cell, key, value, visualRow, visualCol);

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
   * this.flushIndexedCellData is set to true whenever visual indexes change
   *
   */
  public getCellMetaObject(): RA<RA<WbMetaArray>> {
    if (this.flushIndexedCellData || this.indexedCellMeta === undefined) {
      if (this.wbView.hot === undefined) return [];
      const resolveIndex = (
        visualRow: number,
        visualCol: number,
        first: boolean
      ) =>
        (this.wbView.wbUtils.searchPreferences.navigation.direction ===
          'rowFirst') ===
        first
          ? visualRow
          : visualCol;

      const indexedCellMeta: WritableArray<WritableArray<WbMetaArray>> = [];
      Object.entries(this.cellMeta).forEach(([physicalRow, metaRow]) =>
        Object.entries(metaRow).forEach(([physicalCol, cellMeta]) => {
          const visualRow = this.wbView.hot!.toVisualRow(
            (physicalRow as unknown as number) | 0
          );
          const visualCol = this.wbView.hot!.toVisualColumn(
            (physicalCol as unknown as number) | 0
          );
          indexedCellMeta[resolveIndex(visualRow, visualCol, true)] ??= [];
          indexedCellMeta[resolveIndex(visualRow, visualCol, true)][
            resolveIndex(visualRow, visualCol, false)
          ] = cellMeta;
        })
      );
      this.indexedCellMeta = indexedCellMeta;
    }
    this.flushIndexedCellData = false;
    return this.indexedCellMeta;
  }

  // MetaData
  async updateCellInfoStats() {
    const cellMeta = this.cellMeta.flat();

    const cellCounts: WbCellCounts = {
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
    };

    // Update navigation information
    Object.values(
      this.wbView.el.getElementsByClassName('wb-navigation-total')
    ).forEach((navigationTotalElement) => {
      const navigationContainer = navigationTotalElement.closest(
        '.wb-navigation-section'
      );
      if (navigationContainer === null) return;
      const navigationType = navigationContainer.getAttribute(
        'data-navigation-type'
      ) as keyof WbCellCounts | null;
      if (navigationType === null) return;
      navigationTotalElement.textContent =
        cellCounts[navigationType]?.toString();

      if (cellCounts[navigationType] === 0) {
        const currentPositionElement =
          navigationContainer.getElementsByClassName(
            'wb-navigation-position'
          )?.[0];
        if (typeof currentPositionElement === 'object')
          currentPositionElement.textContent = '0';
      }
    });

    const uploadButton =
      this.wbView.el.querySelector<HTMLButtonElement>('.wb-upload');
    if (uploadButton === null) return;
    const title = wbText.uploadUnavailableWhileHasErrors();
    if (
      !uploadButton.disabled ||
      uploadButton.getAttribute('title') === title
    ) {
      const hasErrors = cellCounts.invalidCells > 0;
      uploadButton.toggleAttribute('disabled', hasErrors);
      uploadButton.setAttribute('title', hasErrors ? title : '');
    }

    this.wbView.actions.operationCompletedMessage(cellCounts);
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
      default: {
        return false;
      }
    }
  }
}
/* eslint-enable functional/no-this-expression */
