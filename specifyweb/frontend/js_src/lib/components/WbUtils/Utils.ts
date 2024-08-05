/**
 * Workbench Utilities:
 * Search & Replace, GeoMap, GeoLocate, Coordinate Convertor
 *
 * @module
 *
 */

import type React from 'react';

import { f } from '../../utils/functools';
import type { RA, WritableArray } from '../../utils/types';
import { camelToKebab } from '../../utils/utils';
import type { WbSearchPreferences } from '../WorkBench/AdvancedSearch';
import { getInitialSearchPreferences } from '../WorkBench/AdvancedSearch';
import type { WbCellCounts } from '../WorkBench/CellMeta';
import { getHotPlugin } from '../WorkBench/handsontable';
import { getSelectedLast } from '../WorkBench/hotHelpers';
import type { Workbench } from '../WorkBench/WbView';

const HOT_OFFSET = 3;

/* eslint-disable functional/no-this-expression */
export class WbUtils {
  // eslint-disable-next-line functional/prefer-readonly-type
  public searchQuery: RegExp | string | undefined = undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  private rawSearchQuery: string | undefined = undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  public searchPreferences: WbSearchPreferences = getInitialSearchPreferences();

  public constructor(
    private readonly workbench: Workbench,
    private readonly spreadsheetContainerRef: React.RefObject<HTMLElement>
  ) {}

  public navigateCells({
    type,
    direction,
    currentCellPosition = 0,
    totalCount = 0,
    matchCurrentCell = false,
    currentCell = undefined,
  }: {
    readonly type: keyof WbCellCounts;
    readonly direction: 'next' | 'previous';
    readonly currentCellPosition?: number;
    readonly totalCount?: number;
    // If true and current cell is of correct type, don't navigate away
    readonly matchCurrentCell?: boolean;
    /*
     * Overwrite what is considered to be a current cell
     * Setting to [0,0] and matchCurrentCell=true allows navigation to the first
     * cell of type (used on hitting "Enter" in the Search Box)
     */
    readonly currentCell?: readonly [number, number] | undefined;
  }):
    | readonly [
        {
          readonly visualRow: number;
          readonly visualCol: number;
        },
        number
      ]
    | readonly [undefined, number] {
    const cellMetaObject = this.workbench.cells.getCellMetaObject();
    /*
     * The cellMetaObject is transposed if navigation direction is "Column
     * first".
     * In that case, the meaning of visualRow and visualCol is swapped.
     * resolveIndex exists to resolve the canonical visualRow/visualCol
     */
    const resolveIndex = (
      visualRow: number,
      visualCol: number,
      first: boolean
    ): number =>
      (this.searchPreferences.navigation.direction === 'rowFirst') === first
        ? visualRow
        : visualCol;

    const [currentRow, currentCol] =
      currentCell ?? getSelectedLast(this.workbench.hot!);

    const [currentTransposedRow, currentTransposedCol] = [
      resolveIndex(currentRow, currentCol, true),
      resolveIndex(currentRow, currentCol, false),
    ];

    const compareRows =
      direction === 'next'
        ? (visualRow: number) => visualRow >= currentTransposedRow
        : (visualRow: number) => visualRow <= currentTransposedRow;

    const compareCols =
      direction === 'next'
        ? matchCurrentCell
          ? (visualCol: number) => visualCol >= currentTransposedCol
          : (visualCol: number) => visualCol > currentTransposedCol
        : matchCurrentCell
        ? (visualCol: number) => visualCol <= currentTransposedCol
        : (visualCol: number) => visualCol < currentTransposedCol;

    let matchedCell:
      | {
          readonly visualRow: number;
          readonly visualCol: number;
        }
      | undefined;
    let cellIsTypeCount = 0;

    const orderIt =
      direction === 'next'
        ? f.id
        : <T>(array: RA<T>): RA<T> => Array.from(array).reverse();

    orderIt(Object.entries(cellMetaObject)).find(([visualRowString, metaRow]) =>
      typeof metaRow === 'object'
        ? orderIt(Object.entries(metaRow)).find(
            ([visualColString, metaArray]) => {
              /*
               * This is 10 times faster then Number.parseInt because of a slow
               * Babel polyfill
               */
              const visualRow = f.fastParseInt(visualRowString);
              const visualCol = f.fastParseInt(visualColString);

              const cellTypeMatches = this.workbench.cells?.cellIsType(
                metaArray,
                type
              );
              cellIsTypeCount += cellTypeMatches ? 1 : 0;

              const isWithinBounds =
                compareRows(visualRow) &&
                (visualRow !== currentTransposedRow || compareCols(visualCol));

              const matches = cellTypeMatches && isWithinBounds;
              if (matches)
                matchedCell = {
                  visualRow: resolveIndex(visualRow, visualCol, true),
                  visualCol: resolveIndex(visualRow, visualCol, false),
                };
              return matches;
            }
          )
        : undefined
    );

    let cellRelativePosition;
    if (matchedCell === undefined) cellRelativePosition = 0;
    else if (direction === 'next') cellRelativePosition = cellIsTypeCount;
    else cellRelativePosition = totalCount - cellIsTypeCount + 1;

    const boundaryCell = direction === 'next' ? totalCount : 1;

    let finalCellPosition = currentCellPosition;
    if (
      cellRelativePosition !== 0 ||
      currentCellPosition !== boundaryCell ||
      totalCount === 0
    )
      finalCellPosition = cellRelativePosition;

    if (matchedCell === undefined) return [undefined, finalCellPosition];

    this.workbench.hot?.selectCell(
      matchedCell.visualRow,
      matchedCell.visualCol
    );

    // Turn on the respective cell type if it was hidden
    this.toggleCellTypes(type, 'remove');

    return [matchedCell, finalCellPosition];
  }

  public searchCells(
    event:
      | React.KeyboardEvent<HTMLInputElement>
      | { readonly key: 'SettingsChange' },
    searchQueryElement: HTMLInputElement | null
  ): void {
    if (this.workbench.hot === undefined || searchQueryElement === null) return;
    /*
     * Don't rerun search on live search if search query did not change
     * (e.x, if Ctrl/Cmd+A is clicked in the search box)
     */
    if (
      searchQueryElement.value === this.rawSearchQuery &&
      !['SettingsChange', 'Enter'].includes(event.key)
    )
      return;

    // Don't handle onKeyDown event if live search is disabled
    if (event.key !== 'Enter' && !this.searchPreferences.search.liveUpdate)
      return;

    if (this.parseSearchQuery(searchQueryElement) === undefined) {
      this.toggleCellTypes('searchResults', 'add');
      return;
    }
    this.toggleCellTypes('searchResults', 'remove');

    const data = this.workbench.dataset.rows;
    const firstVisibleRow =
      getHotPlugin(this.workbench.hot, 'autoRowSize').getFirstVisibleRow() -
      HOT_OFFSET;
    const lastVisibleRow =
      getHotPlugin(this.workbench.hot, 'autoRowSize').getLastVisibleRow() +
      HOT_OFFSET;
    const firstVisibleColumn =
      getHotPlugin(
        this.workbench.hot,
        'autoColumnSize'
      ).getFirstVisibleColumn() - HOT_OFFSET;
    const lastVisibleColumn =
      getHotPlugin(
        this.workbench.hot,
        'autoColumnSize'
      ).getLastVisibleColumn() + HOT_OFFSET;

    for (let visualRow = 0; visualRow < data.length; visualRow++) {
      const physicalRow = this.workbench.hot.toPhysicalRow(visualRow);
      for (
        let visualCol = 0;
        visualCol < this.workbench.dataset.columns.length;
        visualCol++
      ) {
        const physicalCol = this.workbench.hot.toPhysicalColumn(visualCol);
        const isSearchResult = this.searchFunction(
          (data[physicalRow][physicalCol] ||
            this.workbench.mappings?.defaultValues[physicalCol]) ??
            ''
        );

        let cell = undefined;
        let render = false;

        /*
         * Calling hot.getCell only if cell is within the render
         * bounds.
         * While hot.getCell is supposed to check for this too, doing it this
         * way makes search about 25% faster
         */
        if (
          firstVisibleRow <= visualRow &&
          lastVisibleRow >= visualRow &&
          firstVisibleColumn <= visualCol &&
          lastVisibleColumn >= visualCol
        ) {
          cell = this.workbench.hot.getCell(visualRow, visualCol) ?? undefined;
          render = Boolean(cell);
        }

        this.workbench.cells[render ? 'updateCellMeta' : 'setCellMeta'](
          physicalRow,
          physicalCol,
          'isSearchResult',
          isSearchResult,
          {
            cell,
            visualRow,
            visualCol,
          }
        );
      }
    }

    this.workbench.cells.updateCellInfoStats();

    // Navigate to the first search result when hitting Enter
    if (event.key === 'Enter')
      this.navigateCells({
        type: 'searchResults',
        direction: 'next',
        matchCurrentCell: event.key === 'Enter',
        currentCell: event.key === 'Enter' ? [0, 0] : undefined,
      });
  }

  private parseSearchQuery(searchQueryElement: HTMLInputElement) {
    if (searchQueryElement === null) return;

    this.rawSearchQuery = searchQueryElement.value;

    this.searchQuery = this.searchPreferences.search.useRegex
      ? this.rawSearchQuery
      : this.rawSearchQuery.trim();

    if (this.searchQuery === '') {
      this.searchQuery = undefined;
      return;
    }

    if (this.searchPreferences.search.useRegex)
      try {
        if (this.searchPreferences.search.fullMatch) {
          if (!this.searchQuery.startsWith('^'))
            this.searchQuery = `^${this.searchQuery}`;
          if (!this.searchQuery.endsWith('$'))
            this.searchQuery = `${this.searchQuery}$`;
        }
        // Regex may be coming from the user, thus disable strict mode

        this.searchQuery = new RegExp(
          this.searchQuery,
          this.searchPreferences.search.caseSensitive ? '' : 'i'
        );
      } catch (error) {
        searchQueryElement.setCustomValidity((error as SyntaxError).message);
        searchQueryElement.reportValidity();
        this.searchQuery = undefined;
        return;
      }
    else if (!this.searchPreferences.search.caseSensitive)
      this.searchQuery = this.searchQuery.toLowerCase();

    searchQueryElement.setCustomValidity('');

    return this.searchQuery;
  }

  public toggleCellTypes(
    navigationType: keyof WbCellCounts,
    action: 'add' | 'remove' | 'toggle' = 'toggle'
  ): void {
    const groupName = camelToKebab(navigationType);
    const cssClassName = `wb-hide-${groupName}`;
    this.spreadsheetContainerRef?.current?.classList[action](cssClassName);
  }

  public searchFunction(initialCellValue = ''): boolean {
    let cellValue = initialCellValue;

    if (this.searchQuery === undefined) return false;

    if (!this.searchPreferences.search.caseSensitive)
      cellValue = cellValue.toLowerCase();

    if (this.searchPreferences.search.useRegex)
      return cellValue.search(this.searchQuery) !== -1;

    return this.searchPreferences.search.fullMatch
      ? cellValue === this.searchQuery
      : cellValue.includes(this.searchQuery as string);
  }

  public replaceCells(
    event: React.KeyboardEvent<HTMLInputElement>,
    replacementValueElement: HTMLInputElement | null
  ): void {
    if (
      event.key !== 'Enter' ||
      (this.searchPreferences.search.useRegex &&
        this.searchQuery === undefined) ||
      this.workbench.hot === undefined ||
      replacementValueElement === null
    )
      return;

    const replacementValue = this.searchPreferences.search.useRegex
      ? replacementValueElement.value
      : replacementValueElement.value.trim();

    const getNewCellValue = this.searchPreferences.search.fullMatch
      ? (): string => replacementValue
      : (cellValue: string): string =>
          this.searchPreferences.search.useRegex
            ? cellValue.replaceAll(
                // Regex may be coming from the user, thus disable strict mode
                // eslint-disable-next-line require-unicode-regexp
                new RegExp(this.searchQuery!, 'g'),
                replacementValue
              )
            : cellValue.split(this.searchQuery ?? '').join(replacementValue);

    if (this.searchPreferences.replace.replaceMode === 'replaceAll') {
      // eslint-disable-next-line functional/prefer-readonly-type
      const modifications: WritableArray<[number, number, string]> = [];
      Object.entries(this.workbench.cells.cellMeta).forEach(
        ([physicalRow, metaRow]) =>
          Object.entries(metaRow).forEach(([physicalCol, metaArray]) => {
            if (
              !this.workbench.cells.getCellMetaFromArray(
                metaArray,
                'isSearchResult'
              )
            )
              return;
            const visualRow = this.workbench.hot!.toVisualRow(
              f.fastParseInt(physicalRow)
            );
            const visualCol = this.workbench.hot!.toVisualColumn(
              f.fastParseInt(physicalCol)
            );
            const cellValue =
              this.workbench.hot!.getDataAtCell(visualRow, visualCol) || '';
            // Don't replace cells with default values
            if (cellValue === '') return;
            modifications.push([
              visualRow,
              visualCol,
              getNewCellValue(cellValue),
            ]);
          })
      );
      this.workbench.hot.setDataAtCell(modifications);
    } else {
      const nextCellOfType = () =>
        this.navigateCells({
          type: 'searchResults',
          direction: 'next',
          matchCurrentCell: false,
        });
      const [currentRow, currentCol] = getSelectedLast(this.workbench.hot);
      const physicalRow = this.workbench.hot.toPhysicalRow(currentRow);
      const physicalCol = this.workbench.hot.toPhysicalColumn(currentCol);
      let nextCell = [currentRow, currentCol] as const;
      if (
        !this.workbench.cells.cellIsType(
          this.workbench.cells.cellMeta[physicalRow]?.[physicalCol],
          'searchResults'
        )
      ) {
        const [next, _] = nextCellOfType();
        if (typeof next === 'object') {
          const { visualRow, visualCol } = next;
          nextCell = [visualRow, visualCol];
        }
      }

      if (!Array.isArray(nextCell)) return;

      this.workbench.hot.setDataAtCell(
        ...nextCell,
        getNewCellValue(this.workbench.hot.getDataAtCell(...nextCell))
      );

      nextCellOfType();
    }
  }
}
