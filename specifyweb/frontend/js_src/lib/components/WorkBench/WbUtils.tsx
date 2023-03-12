/**
 * Workbench Utilities:
 * Search & Replace, GeoMap, GeoLocate, Coordinate Convertor
 *
 * @module
 *
 */

import type Handsontable from 'handsontable';
import React from 'react';
import _ from 'underscore';

import { wbText } from '../../localization/workbench';
import { f } from '../../utils/functools';
import type { RA, WritableArray } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { camelToKebab, clamp } from '../../utils/utils';
import { Backbone } from '../DataModel/backbone';
import { softFail } from '../Errors/Crash';
import { LeafletMap } from '../Leaflet/Map';
import { getLocalitiesDataFromSpreadsheet } from '../Leaflet/wbLocalityDataExtractor';
import { hasPermission } from '../Permissions/helpers';
import type { WbSearchPreferences } from './AdvancedSearch';
import {
  getInitialSearchPreferences,
  WbAdvancedSearch,
} from './AdvancedSearch';
import type { WbCellCounts } from './CellMeta';
import { CoordinateConverter } from './CoordinateConverter';
import { getSelectedLocalities, WbGeoLocate } from './GeoLocate';
import { getHotPlugin } from './handsontable';
import { getSelectedLast, getVisualHeaders } from './hotHelpers';
import type { WbView } from './WbView';

// REFACTOR: rewrite to React
/* eslint-disable functional/no-this-expression */
export class WbUtils extends Backbone.View {
  // eslint-disable-next-line functional/prefer-readonly-type
  public searchQuery: RegExp | string | undefined = undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  private rawSearchQuery: string | undefined = undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  public searchPreferences: WbSearchPreferences = getInitialSearchPreferences();

  // eslint-disable-next-line functional/prefer-readonly-type
  private geoLocateDialog: (() => void) | undefined = undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  private advancedSearch: (() => void) | undefined = undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  private geoMapDialog: (() => void) | undefined = undefined;

  constructor(private readonly wbView: WbView) {
    super({
      el: wbView.el,
      events: {
        'click .wb-cell-navigation': 'navigateCells',
        'click .wb-navigation-text': 'toggleCellTypes',
        'keydown .wb-search-query': 'searchCells',
        'keydown .wb-replace-value': 'replaceCells',
        'click .wb-show-toolkit': 'toggleToolkit',
        'click .wb-geolocate': 'showGeoLocate',
        'click .wb-leafletmap': 'showLeafletMap',
        'click .wb-convert-coordinates': 'showCoordinateConversion',
      },
    });

    const debounced = _.debounce(
      this.searchCells,
      Math.ceil(clamp(10, this.wbView.data.length / 20, 200)),
      false
    ).bind(this);
    // Workaround for _.debounce not working with async functions
    this.searchCells = async (event): Promise<void> => debounced(event);
  }

  render() {
    let initialNavigationDirection =
      this.searchPreferences.navigation.direction;
    this.advancedSearch = this.wbView.options.display(
      <WbAdvancedSearch
        initialSearchPreferences={this.searchPreferences}
        onChange={(newSearchPreferences) => {
          this.searchPreferences = newSearchPreferences;
          if (
            this.searchPreferences.navigation.direction !==
            initialNavigationDirection
          ) {
            this.wbView.cells.flushIndexedCellData = true;
            initialNavigationDirection =
              this.searchPreferences.navigation.direction;
          }
          if (this.searchPreferences.search.liveUpdate)
            this.searchCells({
              key: 'SettingsChange',
            }).catch(softFail);
        }}
      />,
      this.el.getElementsByClassName(
        'wb-advanced-search-wrapper'
      )[0] as HTMLElement
    );

    return this;
  }

  remove(): this {
    this.advancedSearch?.();
    Backbone.View.prototype.remove.call(this);
    return this;
  }

  navigateCells(
    event: { readonly target: Element },
    // If true and current cell is of correct type, don't navigate away
    matchCurrentCell = false,
    /*
     * Overwrite what is considered to be a current cell
     * Setting to [0,0] and matchCurrentCell=true allows navigation to the first
     * cell of type (used on hitting "Enter" in the Search Box)
     */
    currentCell: readonly [number, number] | undefined = undefined
  ):
    | {
        readonly visualRow: number;
        readonly visualCol: number;
      }
    | undefined {
    const button = event.target as HTMLButtonElement | null;
    if (this.wbView.hot === undefined || button === null) return undefined;

    /*
     * Can get data-* via button.dataset, but this way is better as can find
     * usages this way easily (the button.dataset converts keys to camelCase)
     */
    const direction = button.getAttribute('data-navigation-direction');
    const buttonParent = button.parentElement;
    if (buttonParent === null) return undefined;
    const type = buttonParent.getAttribute('data-navigation-type') as
      | keyof WbCellCounts
      | null;
    if (type === null) return undefined;
    const currentPositionElement = buttonParent.getElementsByClassName(
      'wb-navigation-position'
    )[0];
    const totalCountElement = buttonParent.getElementsByClassName(
      'wb-navigation-total'
    )[0];
    const totalCount = Number.parseInt(totalCountElement.textContent ?? '0');

    const cellMetaObject = this.wbView.cells.getCellMetaObject();

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
      currentCell ?? getSelectedLast(this.wbView.hot);

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

              const cellTypeMatches = this.wbView.cells.cellIsType(
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

    const initialCellRelativePosition = Number.parseInt(
      currentPositionElement.textContent ?? '0'
    );
    if (
      cellRelativePosition !== 0 ||
      initialCellRelativePosition !== boundaryCell ||
      totalCount === 0
    )
      currentPositionElement.textContent = cellRelativePosition.toString();

    if (matchedCell === undefined) return undefined;

    this.wbView.hot.selectCell(matchedCell.visualRow, matchedCell.visualCol);

    // Turn on the respective cell type if it was hidden
    this.toggleCellTypes(event, 'remove');

    return matchedCell;
  }

  toggleCellTypes(
    event: { readonly target: Element } | keyof WbCellCounts,
    action: 'add' | 'remove' | 'toggle' = 'toggle'
  ): boolean {
    let navigationType: keyof WbCellCounts | undefined;
    let buttonContainer: HTMLElement | undefined;
    if (typeof event === 'string') {
      navigationType = event;
      buttonContainer =
        this.wbView.el.querySelector<HTMLElement>(
          `.wb-navigation-section[data-navigation-type="${navigationType}"]`
        ) ?? undefined;
    } else {
      const button = event.target as HTMLButtonElement | null;
      buttonContainer = button?.closest('.wb-navigation-section') ?? undefined;
      navigationType = (buttonContainer?.getAttribute('data-navigation-type') ??
        undefined) as keyof WbCellCounts | undefined;
    }
    if (buttonContainer === undefined || navigationType === undefined)
      return false;

    const groupName = camelToKebab(navigationType);
    const cssClassName = `wb-hide-${groupName}`;
    this.el.classList[action](cssClassName);
    const newState = this.el.classList.contains(cssClassName);
    const indicator =
      buttonContainer.getElementsByClassName('wb-navigation-text')[0];
    indicator.setAttribute('aria-pressed', newState ? 'true' : 'false');
    indicator.classList[newState ? 'add' : 'remove']('brightness-50');
    return newState;
  }

  parseSearchQuery() {
    const searchQueryElement =
      this.el.querySelector<HTMLInputElement>('wb-search-query');
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

  async searchCells(
    event: KeyboardEvent | { readonly key: 'SettingsChange' }
  ): Promise<void> {
    if (this.wbView.hot === undefined) return;
    const searchQueryElement = this.el.getElementsByClassName(
      'wb-search-query'
    )[0] as HTMLInputElement;

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

    const navigationContainer =
      this.el.querySelector(
        '.wb-navigation-section[data-navigation-type="searchResults"]'
      ) ?? undefined;
    const navigationTotalElement = navigationContainer?.getElementsByClassName(
      'wb-navigation-total'
    )[0];

    if (
      navigationContainer === undefined ||
      navigationTotalElement === undefined
    )
      return;
    if (this.parseSearchQuery() === undefined) {
      navigationTotalElement.textContent = '0';
      this.toggleCellTypes('searchResults', 'add');
      return;
    }
    this.toggleCellTypes('searchResults', 'remove');

    const navigationButton =
      navigationContainer.getElementsByClassName('wb-cell-navigation');

    let resultsCount = 0;
    const data = this.wbView.dataset.rows;
    const firstVisibleRow =
      getHotPlugin(this.wbView.hot, 'autoRowSize').getFirstVisibleRow() - 3;
    const lastVisibleRow =
      getHotPlugin(this.wbView.hot, 'autoRowSize').getLastVisibleRow() + 3;
    const firstVisibleColumn =
      getHotPlugin(this.wbView.hot, 'autoColumnSize').getFirstVisibleColumn() -
      3;
    const lastVisibleColumn =
      getHotPlugin(this.wbView.hot, 'autoColumnSize').getLastVisibleColumn() +
      3;

    for (let visualRow = 0; visualRow < this.wbView.data.length; visualRow++) {
      const physicalRow = this.wbView.hot.toPhysicalRow(visualRow);
      for (
        let visualCol = 0;
        visualCol < this.wbView.dataset.columns.length;
        visualCol++
      ) {
        const physicalCol = this.wbView.hot.toPhysicalColumn(visualCol);
        const isSearchResult = this.searchFunction(
          (data[physicalRow][physicalCol] ||
            this.wbView.mappings?.defaultValues[physicalCol]) ??
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
          cell = this.wbView.hot.getCell(visualRow, visualCol) ?? undefined;
          render = Boolean(cell);
        }

        this.wbView.cells[render ? 'updateCellMeta' : 'setCellMeta'](
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

    navigationTotalElement.textContent = resultsCount.toString();

    // Navigate to the first search result when hitting Enter
    if (event.key === 'Enter')
      this.navigateCells(
        { target: navigationButton[1] },
        event.key === 'Enter',
        event.key === 'Enter' ? [0, 0] : undefined
      );
  }

  replaceCells(event: KeyboardEvent) {
    const button = event.target as HTMLButtonElement | null;
    if (
      event.key !== 'Enter' ||
      button === null ||
      (this.searchPreferences.search.useRegex &&
        this.searchQuery === undefined) ||
      this.wbView.hot === undefined
    )
      return;

    const buttonContainer = button.parentElement;
    const replacementValueElement = buttonContainer?.getElementsByClassName(
      'wb-replace-value'
    )[0] as HTMLInputElement | undefined;
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
      Object.entries(this.wbView.cells.cellMeta).forEach(
        ([physicalRow, metaRow]) =>
          Object.entries(metaRow).forEach(([physicalCol, metaArray]) => {
            if (
              !this.wbView.cells.getCellMetaFromArray(
                metaArray,
                'isSearchResult'
              )
            )
              return;
            const visualRow = this.wbView.hot!.toVisualRow(
              (physicalRow as unknown as number) | 0
            );
            const visualCol = this.wbView.hot!.toVisualColumn(
              (physicalCol as unknown as number) | 0
            );
            const cellValue =
              this.wbView.hot!.getDataAtCell(visualRow, visualCol) || '';
            // Don't replace cells with default values
            if (cellValue === '') return;
            modifications.push([
              visualRow,
              visualCol,
              getNewCellValue(cellValue),
            ]);
          })
      );
      this.wbView.hot.setDataAtCell(modifications);
    } else {
      const nextCellOfType = () =>
        this.navigateCells(
          {
            target: document.querySelector(
              `.wb-navigation-section[data-navigation-type="searchResults"]
            .wb-cell-navigation[data-navigation-direction="next"]`
            )!,
          },
          false
        );
      const [currentRow, currentCol] = getSelectedLast(this.wbView.hot);
      const physicalRow = this.wbView.hot.toPhysicalRow(currentRow);
      const physicalCol = this.wbView.hot.toPhysicalColumn(currentCol);
      let nextCell = [currentRow, currentCol] as const;
      if (
        !this.wbView.cells.cellIsType(
          this.wbView.cells.cellMeta[physicalRow]?.[physicalCol],
          'searchResults'
        )
      ) {
        const next = nextCellOfType();
        if (typeof next === 'object') {
          const { visualRow, visualCol } = next;
          nextCell = [visualRow, visualCol];
        }
      }

      if (!Array.isArray(nextCell)) return;

      this.wbView.hot.setDataAtCell(
        ...nextCell,
        getNewCellValue(this.wbView.hot.getDataAtCell(...nextCell))
      );

      nextCellOfType();
    }
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

  toggleToolkit(event: MouseEvent): void {
    const toolkit = this.el.getElementsByClassName(
      'wb-toolkit'
    )[0] as HTMLElement;
    const target = event.target as HTMLElement | null;
    target?.toggleAttribute('aria-pressed', toolkit.style.display === 'none');
    toolkit.style.display = toolkit.style.display === 'none' ? '' : 'none';
    this.wbView.handleResize();
  }

  // Context menu item definitions (common for fillUp and fillDown)
  fillCellsContextMenuItem(
    mode: 'down' | 'up'
  ): Handsontable.contextMenu.MenuItemConfig {
    return {
      name: mode === 'up' ? wbText.fillUp() : wbText.fillDown(),
      disabled: () =>
        typeof this.wbView.uploadedView === 'function' ||
        typeof this.wbView.coordinateConverterView === 'function' ||
        !hasPermission('/workbench/dataset', 'update') ||
        (this.wbView.hot
          ?.getSelected()
          ?.every((selection) => selection[0] === selection[2]) ??
          false),
      callback: (_, selections) =>
        selections.forEach((selection) =>
          Array.from(
            new Array(selection.end.col + 1 - selection.start.col).keys()
          ).forEach((index) => {
            const startRow =
              mode === 'up' ? selection.start.row + 1 : selection.start.row;
            const endRow = selection.end.row;
            const col = selection.start.col + index;
            const value =
              mode === 'up'
                ? this.wbView.hot!.getDataAtCell(endRow, col)
                : this.wbView.hot!.getDataAtCell(startRow, col);
            this.wbView.hot?.setDataAtCell(
              Array.from({ length: endRow - startRow }, (_, index) => [
                startRow + index + 1,
                col,
                value,
              ])
            );
          })
        ),
    };
  }

  public findLocalityColumns(): void {
    const leafletButton = this.el.getElementsByClassName(
      'wb-leafletmap'
    )[0] as HTMLButtonElement;
    // These buttons only exist if user has data set update permission
    const geoLocaleButton = this.el.getElementsByClassName(
      'wb-geolocate'
    )[0] as HTMLButtonElement;
    const coordinateConverterButton = this.el.getElementsByClassName(
      'wb-convert-coordinates'
    )[0] as HTMLButtonElement;

    const localityColumns = this.wbView.mappings?.localityColumns ?? [];
    if (localityColumns.length === 0) return;
    leafletButton.disabled = false;
    if (this.wbView.isUploaded)
      filterArray([geoLocaleButton, coordinateConverterButton]).map((button) =>
        button.setAttribute('title', wbText.unavailableWhenUploaded())
      );
    else {
      if (typeof geoLocaleButton === 'object') geoLocaleButton.disabled = false;
      if (typeof coordinateConverterButton === 'object')
        coordinateConverterButton.disabled = false;
    }
  }

  protected showGeoLocate(event: MouseEvent): void {
    if (this.wbView.hot === undefined || this.wbView.mappings === undefined)
      return;
    const target = event.target as HTMLElement;
    // Don't allow opening more than one window)
    if (this.geoLocateDialog !== undefined) {
      this.geoLocateDialog();
      return;
    }

    this.geoLocateDialog = this.wbView.options.display(
      <WbGeoLocate
        columns={this.wbView.dataset.columns}
        hot={this.wbView.hot}
        localityColumns={this.wbView.mappings.localityColumns}
        onClose={() => this.geoLocateDialog?.()}
      />,
      undefined,
      () => {
        target.toggleAttribute('aria-pressed', false);
        this.geoLocateDialog = undefined;
      }
    );

    target.toggleAttribute('aria-pressed', true);
  }

  protected showLeafletMap(event: MouseEvent): void {
    if (this.wbView.hot === undefined || this.wbView.mappings === undefined)
      return;
    if (this.geoMapDialog !== undefined) {
      this.geoMapDialog();
      return;
    }
    const target = event.target as HTMLElement;
    target.toggleAttribute('aria-pressed', true);

    const selection = getSelectedLocalities(
      this.wbView.hot,
      this.wbView.dataset.columns,
      this.wbView.mappings.localityColumns,
      false
    );

    if (selection === undefined) return;

    const localityPoints = getLocalitiesDataFromSpreadsheet(
      this.wbView.mappings.localityColumns,
      selection.visualRows.map((visualRow) =>
        this.wbView.hot!.getDataAtRow(visualRow)
      ),
      getVisualHeaders(this.wbView.hot, this.wbView.dataset.columns),
      selection.visualRows
    );

    this.geoMapDialog = this.wbView.options.display(
      <LeafletMap
        localityPoints={localityPoints}
        modal={false}
        onClose={() => this.geoMapDialog?.()}
        onMarkerClick={(localityPoint) => {
          const rowNumber = localityPoints[localityPoint].rowNumber.value;
          if (typeof rowNumber !== 'number')
            throw new Error('rowNumber must be a number');
          const [_currentRow, currentCol] = getSelectedLast(this.wbView.hot!);
          this.wbView.hot?.scrollViewportTo(rowNumber, currentCol);
          // Select entire row
          this.wbView.hot?.selectRows(rowNumber);
        }}
      />,
      undefined,
      () => {
        this.geoMapDialog = undefined;
        target.toggleAttribute('aria-pressed', false);
      }
    );
  }

  protected showCoordinateConversion(): void {
    if (
      this.wbView.coordinateConverterView !== undefined ||
      this.wbView.mappings === undefined ||
      this.wbView.hot === undefined
    )
      return;

    const buttons = [
      'wb-leafletmap',
      'wb-geolocate',
      'wb-convert-coordinates',
      'wb-replace-value',
    ]
      .map(
        (className) =>
          this.el.getElementsByClassName(className)[0] as HTMLButtonElement
      )
      .map((button) => [button, button.disabled] as const);
    const originalReadOnlyState = this.wbView.hot.getSettings().readOnly;
    this.wbView.hot.updateSettings({
      readOnly: true,
    });
    this.el.classList.add('wb-focus-coordinates');

    this.wbView.coordinateConverterView = this.wbView.options.display(
      <CoordinateConverter
        columns={this.wbView.dataset.columns}
        coordinateColumns={this.wbView.mappings.coordinateColumns}
        data={this.wbView.data}
        hot={this.wbView.hot}
        onClose={() => this.wbView.coordinateConverterView?.()}
      />,
      undefined,
      () => {
        this.wbView.coordinateConverterView = undefined;
        buttons.forEach(([button, isDisabled]) => {
          button.disabled = isDisabled;
        });
        this.wbView.hot?.updateSettings({
          readOnly: originalReadOnlyState,
        });
        this.el.classList.remove('wb-focus-coordinates');
      }
    );
  }
}
/* eslint-enable functional/no-this-expression */
