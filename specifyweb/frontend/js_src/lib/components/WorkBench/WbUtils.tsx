/**
 * Workbench Utilities:
 * Search & Replace, GeoMap, GeoLocate, Coordinate Convertor
 *
 * @module
 *
 */

import React from 'react';
import _ from 'underscore';

import { wbText } from '../../localization/workbench';
import { f } from '../../utils/functools';
import type { RA, WritableArray } from '../../utils/types';
import { camelToKebab } from '../../utils/utils';
import { hasPermission } from '../Permissions/helpers';
import type { WbSearchPreferences } from './AdvancedSearch';
import {
  getInitialSearchPreferences,
  WbAdvancedSearch,
} from './AdvancedSearch';
import type { WbCellCounts, WbCellMeta } from './CellMeta';
import { getHotPlugin } from './handsontable';
import { getSelectedLast } from './hotHelpers';
import type { Workbench } from './WbView';
import { Input } from '../Atoms/Form';
import { commonText } from '../../localization/common';
import { ReadOnlyContext } from '../Core/Contexts';
import { Navigation } from './Navigation';

export function WbUtilsComponent({
  isUploaded,
  cellCounts,
  utils,
  cells,
  debounceRate,
}: {
  readonly isUploaded: boolean;
  readonly cellCounts: WbCellCounts;
  readonly utils: WbUtils;
  readonly cells: WbCellMeta;
  readonly debounceRate: number;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const replaceRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div
      aria-label={wbText.navigation()}
      className="flex flex-wrap justify-end gap-x-1 gap-y-2"
      role="toolbar"
    >
      <span className="contents" role="search">
        <div className="flex">
          <Input.Generic
            forwardRef={searchRef}
            aria-label={commonText.searchQuery()}
            autoComplete="on"
            placeholder={commonText.search()}
            spellCheck
            title={commonText.searchQuery()}
            type="search"
            onKeyDown={_.debounce(
              (event: React.KeyboardEvent<HTMLInputElement>) =>
                utils.searchCells(event, searchRef.current!),
              debounceRate,
              true
            )}
          />
        </div>
        {!isUploaded && hasPermission('/workbench/dataset', 'update') ? (
          <div className="flex">
            <Input.Generic
              forwardRef={replaceRef}
              aria-label={wbText.replacementValue()}
              autoComplete="on"
              placeholder={wbText.replace()}
              title={wbText.replacementValue()}
              type="search"
              onKeyDown={(event) =>
                utils.replaceCells(event, replaceRef.current!)
              }
              disabled={isReadOnly}
            />
          </div>
        ) : undefined}
        <WbAdvancedSearch
          initialSearchPreferences={utils.searchPreferences}
          onChange={(newSearchPreferences) => {
            if (
              newSearchPreferences.navigation.direction !==
              utils.searchPreferences.navigation.direction
            ) {
              cells.flushIndexedCellData = true;
            }
            utils.searchPreferences = newSearchPreferences;
            // TODO: figure out what searchCells with SettingsChange does
            // if (utils.searchPreferences.search.liveUpdate)
            //   utils.searchCells({
            //     key: 'SettingsChange',
            //   }).catch(softFail);
          }}
        />
      </span>
      <Navigation
        label={wbText.searchResults()}
        name="searchResults"
        totalCount={cellCounts.searchResults}
        utils={utils}
      />
      {!isUploaded && hasPermission('/workbench/dataset', 'update') ? (
        <Navigation
          label={wbText.modifiedCells()}
          name="modifiedCells"
          totalCount={cellCounts.modifiedCells}
          utils={utils}
        />
      ) : undefined}
      <Navigation
        label={wbText.newCells()}
        name="newCells"
        totalCount={cellCounts.newCells}
        utils={utils}
      />
      {!isUploaded && (
        <Navigation
          label={wbText.errorCells()}
          name="invalidCells"
          totalCount={cellCounts.invalidCells}
          utils={utils}
        />
      )}
    </div>
  );
}

/* eslint-disable functional/no-this-expression */
export class WbUtils {
  // eslint-disable-next-line functional/prefer-readonly-type
  public searchQuery: RegExp | string | undefined = undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  private rawSearchQuery: string | undefined = undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  public searchPreferences: WbSearchPreferences = getInitialSearchPreferences();

  constructor(private readonly workbench: Workbench) {}

  navigateCells({
    type,
    direction,
    currentCellPosition = 0,
    totalCount = 0,
    matchCurrentCell = false,
    currentCell = undefined,
  }: {
    type: keyof WbCellCounts;
    direction: 'previous' | 'next';
    currentCellPosition?: number;
    totalCount?: number;
    // If true and current cell is of correct type, don't navigate away
    matchCurrentCell?: boolean;
    /*
     * Overwrite what is considered to be a current cell
     * Setting to [0,0] and matchCurrentCell=true allows navigation to the first
     * cell of type (used on hitting "Enter" in the Search Box)
     */
    currentCell?: readonly [number, number] | undefined;
  }):
    | [
        {
          readonly visualRow: number;
          readonly visualCol: number;
        },
        number
      ]
    | [undefined, number] {
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
        : <T,>(array: RA<T>): RA<T> => Array.from(array).reverse();

    orderIt(Object.entries(cellMetaObject)).find(([visualRowString, metaRow]) =>
      typeof metaRow === 'object'
        ? orderIt(Object.entries(metaRow)).find(
            ([visualColString, metaArray]) => {
              /*
               * This is 10 times faster then Number.parseInt because of a slow
               * Babel polyfill
               */
              const visualRow = (visualRowString as unknown as number) | 0;
              const visualCol = (visualColString as unknown as number) | 0;

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

  searchCells(
    event:
      | React.KeyboardEvent<HTMLInputElement>
      | { readonly key: 'SettingsChange' },
    searchQueryElement: HTMLInputElement
  ) {
    if (this.workbench.hot === undefined) return;
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
      getHotPlugin(this.workbench.hot, 'autoRowSize').getFirstVisibleRow() - 3;
    const lastVisibleRow =
      getHotPlugin(this.workbench.hot, 'autoRowSize').getLastVisibleRow() + 3;
    const firstVisibleColumn =
      getHotPlugin(
        this.workbench.hot,
        'autoColumnSize'
      ).getFirstVisibleColumn() - 3;
    const lastVisibleColumn =
      getHotPlugin(
        this.workbench.hot,
        'autoColumnSize'
      ).getLastVisibleColumn() + 3;

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

        this.workbench.cells![render ? 'updateCellMeta' : 'setCellMeta'](
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

  parseSearchQuery(searchQueryElement: HTMLInputElement) {
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

  toggleCellTypes(
    navigationType: keyof WbCellCounts,
    action: 'add' | 'remove' | 'toggle' = 'toggle'
  ): void {
    const groupName = camelToKebab(navigationType);
    const cssClassName = `wb-hide-${groupName}`;
    const { current: spreadsheetContainer } =
      this.workbench.spreadsheetContainerRef;
    if (spreadsheetContainer)
      spreadsheetContainer.classList[action](cssClassName);
  }

  searchFunction(initialCellValue = '') {
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

  replaceCells(
    event: React.KeyboardEvent<HTMLInputElement>,
    replacementValueElement: HTMLInputElement
  ) {
    if (
      event.key !== 'Enter' ||
      (this.searchPreferences.search.useRegex &&
        this.searchQuery === undefined) ||
      this.workbench.hot === undefined
    )
      return;

    if (replacementValueElement === undefined) return;
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
      Object.entries(this.workbench.cells!.cellMeta).forEach(
        ([physicalRow, metaRow]) =>
          Object.entries(metaRow).forEach(([physicalCol, metaArray]) => {
            if (
              !this.workbench.cells!.getCellMetaFromArray(
                metaArray,
                'isSearchResult'
              )
            )
              return;
            const visualRow = this.workbench.hot!.toVisualRow(
              (physicalRow as unknown as number) | 0
            );
            const visualCol = this.workbench.hot!.toVisualColumn(
              (physicalCol as unknown as number) | 0
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
        !this.workbench.cells!.cellIsType(
          this.workbench.cells!.cellMeta[physicalRow]?.[physicalCol],
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
