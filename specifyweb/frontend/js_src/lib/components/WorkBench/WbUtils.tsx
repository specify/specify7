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
import type { WbCellCounts } from './CellMeta';
import { getHotPlugin } from './handsontable';
import { getSelectedLast } from './hotHelpers';
import type { Workbench } from './WbView';
import { Input } from '../Atoms/Form';
import { LocalizedString } from 'typesafe-i18n';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { commonText } from '../../localization/common';
import { useBooleanState } from '../../hooks/useBooleanState';
import { icons } from '../Atoms/Icons';

function Navigation({
  name,
  label,
  totalCount,
  utils,
  spreadsheetContainer,
}: {
  readonly name: keyof WbCellCounts;
  readonly label: LocalizedString;
  readonly totalCount: number;
  readonly utils: WbUtils;
  readonly spreadsheetContainer: any;
}): JSX.Element {
  const [currentPosition, setCurrentPosition] = React.useState<number>(0);
  const [buttonIsPressed, _press, _unpress, togglePress] = useBooleanState();
  const handleTypeToggle = () => {
    togglePress();
    utils.toggleCellTypes(name, 'toggle', spreadsheetContainer.current);
  };
  const handlePrevious = () => {
    const [_, position] = utils.navigateCells({
      type: name,
      direction: 'previous',
      currentCellPosition: currentPosition,
      totalCount,
    });
    setCurrentPosition(position);
  };
  const handleNext = () => {
    const [_, position] = utils.navigateCells({
      type: name,
      direction: 'next',
      currentCellPosition: currentPosition,
      totalCount,
    });
    setCurrentPosition(position);
  };
  return (
    <span
      aria-atomic
      className="wb-navigation-section flex rounded"
      data-navigation-type={name}
    >
      <Button.Small
        className="brightness-80 hover:brightness-70 p-2 ring-0"
        data-navigation-direction="previous"
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        onClick={handlePrevious}
      >
        {icons.chevronLeft}
      </Button.Small>
      <Button.Small
        className={`
          hover:brightness-70 grid grid-cols-[auto_1fr_auto_1fr_auto]
          items-center ring-0
          ${className.ariaHandled}
          ${buttonIsPressed ? 'brightness-50' : ''}
        `}
        aria-pressed={buttonIsPressed}
        title={wbText.clickToToggle()}
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        onClick={handleTypeToggle}
      >
        {label} (
        <span className="text-center">
          {currentPosition}
        </span>
        /<span>{totalCount}</span>)
      </Button.Small>
      <Button.Small
        className="brightness-80 hover:brightness-70 p-2 ring-0"
        data-navigation-direction="next"
        type="button"
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        onClick={handleNext}
      >
        {icons.chevronRight}
      </Button.Small>
    </span>
  );
}

export function WbUtilsComponent({
  isUploaded,
  cellCounts,
  utils,
  spreadsheetContainer,
}: {
  readonly isUploaded: boolean;
  readonly cellCounts: WbCellCounts;
  readonly utils: WbUtils;
  readonly spreadsheetContainer: any;
}): JSX.Element {
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const replaceRef = React.useRef<HTMLInputElement | null>(null);

  const handleSearch = (event: KeyboardEvent) => {
    // TODO: check if debounce is needed here
    utils.searchCells(
      event,
      searchRef.current as HTMLInputElement,
      spreadsheetContainer.current
    );
  };

  const handleReplace = (event: KeyboardEvent) => {
    utils.replaceCells(event, replaceRef.current as HTMLInputElement);
  };

  return (
    <>
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
              onKeyDown={handleSearch}
            />
          </div>
          {!isUploaded && hasPermission('/workbench/dataset', 'update') ? (
            <div className="flex">
              <Input.Text
                forwardRef={replaceRef}
                aria-label={wbText.replacementValue()}
                autoComplete="on"
                placeholder={wbText.replace()}
                title={wbText.replacementValue()}
                onKeyDown={handleReplace}
              />
            </div>
          ) : undefined}
          <span>
            <WbAdvancedSearch
              initialSearchPreferences={utils.searchPreferences}
              onChange={(newSearchPreferences) => {
                if (
                  newSearchPreferences.navigation.direction !==
                  utils.searchPreferences.navigation.direction
                ) {
                  // TODO: add workbench or cells to parent component
                  // cells.flushIndexedCellData = true;
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
        </span>
        <Navigation
          label={wbText.searchResults()}
          name="searchResults"
          totalCount={cellCounts.searchResults}
          utils={utils}
          spreadsheetContainer={spreadsheetContainer}
        />
        {!isUploaded && hasPermission('/workbench/dataset', 'update') ? (
          <Navigation
            label={wbText.modifiedCells()}
            name="modifiedCells"
            totalCount={cellCounts.modifiedCells}
            utils={utils}
            spreadsheetContainer={spreadsheetContainer}
          />
        ) : undefined}
        <Navigation
          label={wbText.newCells()}
          name="newCells"
          totalCount={cellCounts.newCells}
          utils={utils}
          spreadsheetContainer={spreadsheetContainer}
        />
        {!isUploaded && (
          <Navigation
            label={wbText.errorCells()}
            name="invalidCells"
            totalCount={cellCounts.invalidCells}
            utils={utils}
            spreadsheetContainer={spreadsheetContainer}
          />
        )}
      </div>
    </>
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
      currentCell ?? getSelectedLast(this.workbench.hot);

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

    this.workbench.hot.selectCell(matchedCell.visualRow, matchedCell.visualCol);

    // Turn on the respective cell type if it was hidden
    // TODO: figure out if this is needed
    // this.toggleCellTypes(event, 'remove');

    return [matchedCell, finalCellPosition];
  }

  searchCells(
    event: KeyboardEvent | { readonly key: 'SettingsChange' },
    searchQueryElement: HTMLInputElement,
    spreadsheetContainer: any
  ) {
    if (!this.workbench.hot) return;
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
      // navigationTotalElement.textContent = '0';
      this.toggleCellTypes('searchResults', 'add', spreadsheetContainer);
      return;
    }
    this.toggleCellTypes('searchResults', 'remove', spreadsheetContainer);

    let resultsCount = 0;
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
         * Calling this.wbView.hot.getCell only if cell is within the render
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
        if (isSearchResult) resultsCount += 1;
      }
    }

    this.workbench.cells.updateCellInfoStats();

    // navigationTotalElement.textContent = resultsCount.toString();

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
    action: 'add' | 'remove' | 'toggle' = 'toggle',
    spreadsheetContainer?: any
  ): void {
    const groupName = camelToKebab(navigationType);
    const cssClassName = `wb-hide-${groupName}`;
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
    event: KeyboardEvent,
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
