/**
 * Workbench Utilities:
 * Search & Replace, GeoMap, GeoLocate, Coordinate Convertor
 *
 * @module
 *
 */

import $ from 'jquery';
import React from 'react';
import _ from 'underscore';

import { wbText } from '../../localization/workbench';
import { filterArray } from '../../utils/types';
import { camelToKebab, clamp } from '../../utils/utils';
import { Backbone } from '../DataModel/backbone';
import { LeafletMap } from '../Leaflet/Map';
import {
  findLocalityColumnsInDataSet,
  getLocalitiesDataFromSpreadsheet,
} from '../Leaflet/wbLocalityDataExtractor';
import {
  getInitialSearchPreferences,
  WbAdvancedSearch,
} from './AdvancedSearch';
import { CoordinateConverter } from './CoordinateConverter';
import { getSelectedLocalities, WbGeoLocate } from './GeoLocate';
import { getSelectedLast, getVisualHeaders } from './hotHelpers';

// REFACTOR: rewrite to React
export const WBUtils = Backbone.View.extend({
  __name__: 'WbUtils',
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
  initialize({ wbview }) {
    this.wbview = wbview;

    this.localityColumns = [];
    this.searchQuery = undefined;
    this.rawSearchQuery = undefined;
    this.searchPreferences = getInitialSearchPreferences();
    this.geoLocateDialog = undefined;
    this.geoMapDialog = undefined;
    this.searchCells = _.debounce(
      this.searchCells,
      Math.ceil(clamp(10, this.wbview.data.length / 20, 200)),
      false
    );
  },
  render() {
    let initialNavigationDirection =
      this.searchPreferences.navigation.direction;
    this.advancedSearch = this.wbview.options.display(
      <WbAdvancedSearch
        initialSearchPreferences={this.searchPreferences}
        onChange={(newSearchPreferences) => {
          this.searchPreferences = newSearchPreferences;
          if (
            this.searchPreferences.navigation.direction !==
            initialNavigationDirection
          ) {
            this.wbview.flushIndexedCellData = true;
            initialNavigationDirection =
              this.searchPreferences.navigation.direction;
          }
          if (this.searchPreferences.search.liveUpdate)
            this.searchCells({
              key: 'SettingsChange',
            });
        }}
      />,
      this.el.getElementsByClassName('wb-advanced-search-wrapper')[0]
    );

    return this;
  },
  remove() {
    this.advancedSearch();
    Backbone.View.prototype.remove.call(this);
  },

  cellIsType(metaArray, type) {
    switch (type) {
      case 'invalidCells': {
        return this.wbview.getCellMetaFromArray(metaArray, 'issues').length > 0;
      }
      case 'newCells': {
        return this.wbview.getCellMetaFromArray(metaArray, 'isNew');
      }
      case 'modifiedCells': {
        return this.wbview.getCellMetaFromArray(metaArray, 'isModified');
      }
      case 'searchResults': {
        return this.wbview.getCellMetaFromArray(metaArray, 'isSearchResult');
      }
      default: {
        return false;
      }
    }
  },
  navigateCells(
    event,
    // If true and current cell is of correct type, don't navigate away
    matchCurrentCell = false,
    /*
     * Overwrite what is considered to be a current cell
     * Setting to [0,0] and matchCurrentCell=true allows navigation to the first
     * cell of type (used on hitting "Enter" in the Search Box)
     */
    currentCell = undefined
  ) {
    const button = event.target;
    /*
     * Can get data-* via button.dataset, but this way is better as can find
     * usages this way easily (the button.dataset converts keys to camelCase)
     */
    const direction = button.getAttribute('data-navigation-direction');
    const buttonParent = button.parentElement;
    const type = buttonParent.getAttribute('data-navigation-type');
    const currentPositionElement = buttonParent.getElementsByClassName(
      'wb-navigation-position'
    )[0];
    const totalCountElement = buttonParent.getElementsByClassName(
      'wb-navigation-total'
    )[0];
    const totalCount = Number.parseInt(totalCountElement.textContent);

    const cellMetaObject = this.wbview.getCellMetaObject();

    /*
     * The cellMetaObject is transposed if navigation direction is "Column
     * first".
     * In that case, the meaning of visualRow and visualCol is swapped.
     * resolveIndex exists to resolve the canonical visualRow/visualCol
     */
    const resolveIndex = (visualRow, visualCol, first) =>
      (this.searchPreferences.navigation.direction === 'rowFirst') === first
        ? visualRow
        : visualCol;

    const [currentRow, currentCol] =
      currentCell ?? getSelectedLast(this.wbview.hot);

    const [currentTransposedRow, currentTransposedCol] = [
      resolveIndex(currentRow, currentCol, true),
      resolveIndex(currentRow, currentCol, false),
    ];

    const compareRows =
      direction === 'next'
        ? (visualRow) => visualRow >= currentTransposedRow
        : (visualRow) => visualRow <= currentTransposedRow;

    const compareCols =
      direction === 'next'
        ? matchCurrentCell
          ? (visualCol) => visualCol >= currentTransposedCol
          : (visualCol) => visualCol > currentTransposedCol
        : matchCurrentCell
        ? (visualCol) => visualCol <= currentTransposedCol
        : (visualCol) => visualCol < currentTransposedCol;

    let matchedCell;
    let cellIsTypeCount = 0;

    const orderIt =
      direction === 'next'
        ? (array) => array
        : (array) => Array.from(array).reverse();

    orderIt(Object.entries(cellMetaObject)).find(
      ([visualRowString, metaRow]) =>
        metaRow &&
        orderIt(Object.entries(metaRow)).find(
          ([visualColString, metaArray]) => {
            /*
             * This is 10 times faster then Number.parseInt because of a slow
             * Babel polyfill
             */
            const visualRow = visualRowString | 0;
            const visualCol = visualColString | 0;

            const cellTypeMatches = this.cellIsType(metaArray, type);
            cellIsTypeCount += cellTypeMatches;

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
    );

    let cellRelativePosition;
    if (matchedCell === undefined) cellRelativePosition = 0;
    else if (direction === 'next') cellRelativePosition = cellIsTypeCount;
    else cellRelativePosition = totalCount - cellIsTypeCount + 1;

    const boundaryCell = direction === 'next' ? totalCount : 1;

    const initialCellRelativePosition = Number.parseInt(
      currentPositionElement.textContent || '0'
    );
    if (
      cellRelativePosition !== 0 ||
      initialCellRelativePosition !== boundaryCell ||
      totalCount === 0
    )
      currentPositionElement.textContent = cellRelativePosition;

    if (matchedCell === undefined) return false;

    this.wbview.hot.selectCell(matchedCell.visualRow, matchedCell.visualCol);

    // Turn on the respective cell type if it was hidden
    this.toggleCellTypes(event, 'remove');

    return [matchedCell.visualRow, matchedCell.visualCol];
  },
  toggleCellTypes(event, action = 'toggle') {
    let navigationType;
    let buttonContainer;
    if (typeof event === 'string') {
      navigationType = event;
      buttonContainer = this.el.querySelector(
        `.wb-navigation-section[data-navigation-type="${navigationType}"]`
      );
    } else {
      const button = event.target;
      buttonContainer = button.closest('.wb-navigation-section');
      navigationType = buttonContainer.getAttribute('data-navigation-type');
    }
    const groupName = camelToKebab(navigationType);
    const cssClassName = `wb-hide-${groupName}`;
    this.el.classList[action](cssClassName);
    const newState = this.el.classList.contains(cssClassName);
    const indicator =
      buttonContainer.getElementsByClassName('wb-navigation-text')[0];
    indicator.setAttribute('aria-pressed', newState ? 'true' : 'false');
    indicator.classList[newState ? 'add' : 'remove']('brightness-50');
    return newState;
  },
  parseSearchQuery() {
    const searchQueryElement =
      this.el.getElementsByClassName('wb-search-query')[0];

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
          if (this.searchQuery[0] !== '^')
            this.searchQuery = `^${this.searchQuery}`;
          if (this.searchQuery.slice(-1) !== '$')
            this.searchQuery = `${this.searchQuery}$`;
        }
        // Regex may be coming from the user, thus disable strict mode

        this.searchQuery = new RegExp(
          this.searchQuery,
          this.searchPreferences.search.caseSensitive ? '' : 'i'
        );
      } catch (error) {
        searchQueryElement.setCustomValidity(error.message);
        searchQueryElement.reportValidity();
        this.searchQuery = undefined;
        return;
      }
    else if (!this.searchPreferences.search.caseSensitive)
      this.searchQuery = this.searchQuery.toLowerCase();

    searchQueryElement.setCustomValidity('');

    return this.searchQuery;
  },
  async searchCells(event) {
    const searchQueryElement =
      this.el.getElementsByClassName('wb-search-query')[0];

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

    const navigationContainer = this.el.querySelector(
      '.wb-navigation-section[data-navigation-type="searchResults"]'
    );
    const navigationTotalElement = navigationContainer.getElementsByClassName(
      'wb-navigation-total'
    )[0];

    if (this.parseSearchQuery() === undefined) {
      navigationTotalElement.textContent = '0';
      this.toggleCellTypes('searchResults', 'add');
      return;
    }
    this.toggleCellTypes('searchResults', 'remove');

    const navigationButton =
      navigationContainer.getElementsByClassName('wb-cell-navigation');

    let resultsCount = 0;
    const data = this.wbview.dataset.rows;
    const firstVisibleRow =
      this.wbview.getHotPlugin('autoRowSize').getFirstVisibleRow() - 3;
    const lastVisibleRow =
      this.wbview.getHotPlugin('autoRowSize').getLastVisibleRow() + 3;
    const firstVisibleColumn =
      this.wbview.getHotPlugin('autoColumnSize').getFirstVisibleColumn() - 3;
    const lastVisibleColumn =
      this.wbview.getHotPlugin('autoColumnSize').getLastVisibleColumn() + 3;

    for (let visualRow = 0; visualRow < this.wbview.data.length; visualRow++) {
      const physicalRow = this.wbview.hot.toPhysicalRow(visualRow);
      for (
        let visualCol = 0;
        visualCol < this.wbview.dataset.columns.length;
        visualCol++
      ) {
        const physicalCol = this.wbview.hot.toPhysicalColumn(visualCol);
        const isSearchResult = this.searchFunction(
          (data[physicalRow][physicalCol] ||
            this.wbview.mappings?.defaultValues[physicalCol]) ??
            ''
        );

        let cell = undefined;
        let render = false;

        /*
         * Calling this.wbview.hot.getCell only if cell is within the render
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
          cell = this.wbview.hot.getCell(visualRow, visualCol);
          render = Boolean(cell);
        }

        this.wbview[render ? 'updateCellMeta' : 'setCellMeta'](
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
  },
  replaceCells(event) {
    if (event.key !== 'Enter') return;

    const button = event.target;
    const buttonContainer = button.parentElement;
    const replacementValueElement =
      buttonContainer.getElementsByClassName('wb-replace-value')[0];
    const replacementValue = this.searchPreferences.search.useRegex
      ? replacementValueElement.value
      : replacementValueElement.value.trim();

    const getNewCellValue = this.searchPreferences.search.fullMatch
      ? () => replacementValue
      : (cellValue) =>
          this.searchPreferences.search.useRegex
            ? cellValue.replaceAll(
                // Regex may be coming from the user, thus disable strict mode
                // eslint-disable-next-line require-unicode-regexp
                new RegExp(this.searchQuery, 'g'),
                replacementValue
              )
            : cellValue.split(this.searchQuery).join(replacementValue);

    if (this.searchPreferences.replace.replaceMode === 'replaceAll') {
      const modifications = [];
      Object.entries(this.wbview.cellMeta).forEach(([physicalRow, metaRow]) =>
        Object.entries(metaRow).forEach(([physicalCol, metaArray]) => {
          if (!this.wbview.getCellMetaFromArray(metaArray, 'isSearchResult'))
            return;
          const visualRow = this.wbview.hot.toVisualRow(physicalRow | 0);
          const visualCol = this.wbview.hot.toVisualColumn(physicalCol | 0);
          const cellValue =
            this.wbview.hot.getDataAtCell(visualRow, visualCol) || '';
          // Don't replace cells with default values
          if (cellValue === '') return;
          modifications.push([
            visualRow,
            visualCol,
            getNewCellValue(cellValue),
          ]);
        })
      );
      this.wbview.hot.setDataAtCell(modifications);
    } else {
      const nextCellOfType = () =>
        this.navigateCells(
          {
            target: document.querySelector(
              `.wb-navigation-section[data-navigation-type="searchResults"]
            .wb-cell-navigation[data-navigation-direction="next"]`
            ),
          },
          false
        );
      const [currentRow, currentCol] = getSelectedLast(this.wbview.hot);
      const physicalRow = this.wbview.hot.toPhysicalRow(currentRow);
      const physicalCol = this.wbview.hot.toPhysicalColumn(currentCol);
      let nextCell;
      nextCell = this.cellIsType(
        this.wbview.cellMeta[physicalRow]?.[physicalCol],
        'searchResults'
      )
        ? [currentRow, currentCol]
        : nextCellOfType();

      if (!Array.isArray(nextCell)) return;

      this.wbview.hot.setDataAtCell(
        ...nextCell,
        getNewCellValue(this.wbview.hot.getDataAtCell(...nextCell))
      );

      nextCellOfType();
    }
  },
  searchFunction(initialCellValue = '') {
    let cellValue = initialCellValue;

    if (this.searchQuery === undefined) return false;

    if (!this.searchPreferences.search.caseSensitive)
      cellValue = cellValue.toLowerCase();

    if (this.searchPreferences.search.useRegex)
      return cellValue.search(this.searchQuery) !== -1;

    return this.searchPreferences.search.fullMatch
      ? cellValue === this.searchQuery
      : cellValue.includes(this.searchQuery);
  },
  toggleToolkit(event) {
    const toolkit = this.el.getElementsByClassName('wb-toolkit')[0];
    event.target.setAttribute('aria-pressed', toolkit.style.display === 'none');
    toolkit.style.display = toolkit.style.display === 'none' ? '' : 'none';
    this.wbview.handleResize();
  },
  // Fill cells with a value
  fillCells({ startRow, endRow, col, value }) {
    this.wbview.hot.setDataAtCell(
      Array.from({ length: endRow - startRow }, (_, index) => [
        startRow + index + 1,
        col,
        value,
      ])
    );
  },
  fillDown(props) {
    this.fillCells({
      ...props,
      value: this.wbview.hot.getDataAtCell(props.startRow, props.col),
    });
  },
  fillUp(props) {
    this.fillCells({
      ...props,
      startRow: props.startRow - 1,
      value: this.wbview.hot.getDataAtCell(props.endRow, props.col),
    });
  },
  // Context menu item definitions (common for fillUp and fillDown)
  fillCellsContextMenuItem(name, handlerFunction, isDisabled) {
    return {
      name,
      disabled: () =>
        isDisabled() ||
        (this.wbview.hot
          .getSelected()
          ?.every((selection) => selection[0] === selection[2]) ??
          false),
      callback: (_, selections) =>
        selections.forEach((selection) =>
          Array.from(
            new Array(selection.end.col + 1 - selection.start.col).keys()
          ).forEach((index) =>
            handlerFunction.bind(this)({
              startRow: selection.start.row,
              endRow: selection.end.row,
              col: selection.start.col + index,
            })
          )
        ) || this.wbview.hot.deselectCell(),
    };
  },
  findLocalityColumns() {
    this.localityColumns = this.wbview.mappings
      ? findLocalityColumnsInDataSet(
          this.wbview.mappings.baseTable.name,
          this.wbview.mappings.lines
        )
      : [];

    const leafletButton = this.el.getElementsByClassName('wb-leafletmap')[0];
    // These buttons only exist if user has data set update permission
    const geoLocaleButton = this.el.getElementsByClassName('wb-geolocate')[0];
    const coordinateConverterButton = this.el.getElementsByClassName(
      'wb-convert-coordinates'
    )[0];

    if (this.localityColumns.length > 0) {
      leafletButton.disabled = false;
      if (this.wbview.isUploaded)
        filterArray([geoLocaleButton, coordinateConverterButton]).map(
          (button) =>
            button.setAttribute('title', wbText.unavailableWhenUploaded())
        );
      else {
        if (typeof geoLocaleButton === 'object')
          geoLocaleButton.disabled = false;
        if (typeof coordinateConverterButton === 'object')
          coordinateConverterButton.disabled = false;
      }
    }
  },

  showGeoLocate(event) {
    // Don't allow opening more than one window)
    if (this.geoLocateDialog !== undefined) {
      this.geoLocateDialog();
      return;
    }

    this.geoLocateDialog = this.wbview.options.display(
      <WbGeoLocate
        columns={this.wbview.dataset.columns}
        hot={this.wbview.hot}
        localityColumns={this.localityColumns}
        onClose={() => this.geoLocateDialog()}
      />,
      undefined,
      () => {
        event.target.setAttribute('aria-pressed', false);
        this.geoLocateDialog = undefined;
      }
    );

    event.target.setAttribute('aria-pressed', true);
  },
  showLeafletMap(event) {
    if (this.geoMapDialog !== undefined) {
      this.geoMapDialog();
      return;
    }
    event.target.setAttribute('aria-pressed', true);

    const selection = getSelectedLocalities(
      this.wbview.hot,
      this.wbview.dataset.columns,
      this.localityColumns,
      false
    );

    if (selection === undefined) return;

    const localityPoints = getLocalitiesDataFromSpreadsheet(
      this.localityColumns,
      selection.visualRows.map((visualRow) =>
        this.wbview.hot.getDataAtRow(visualRow)
      ),
      getVisualHeaders(this.wbview.hot, this.wbview.dataset.columns),
      selection.visualRows
    );

    this.geoMapDialog = this.wbview.options.display(
      <LeafletMap
        localityPoints={localityPoints}
        modal={false}
        onClose={() => this.geoMapDialog()}
        onMarkerClick={(localityPoint) => {
          const rowNumber = localityPoints[localityPoint].rowNumber.value;
          if (typeof rowNumber !== 'number')
            throw new Error('rowNumber must be a number');
          const [_currentRow, currentCol] = getSelectedLast(this.wbview.hot);
          this.wbview.hot.scrollViewportTo(rowNumber, currentCol);
          // Select entire row
          this.wbview.hot.selectRows(rowNumber);
        }}
      />,
      undefined,
      () => {
        this.geoMapDialog = undefined;
        event.target.setAttribute('aria-pressed', false);
      }
    );
  },
  showCoordinateConversion() {
    if (this.wbview.coordinateConverterView !== undefined) return;

    const buttons = [
      'wb-leafletmap',
      'wb-geolocate',
      'wb-convert-coordinates',
      'wb-replace-value',
    ]
      .map((className) => this.el.getElementsByClassName(className)[0])
      .map((button) => [button, button.disabled]);
    const originalReadOnlyState = this.wbview.isReadOnly;
    this.wbview.hot.updateSettings({
      readOnly: true,
    });
    this.el.classList.add('wb-focus-coordinates');

    this.wbview.coordinateConverterView = this.wbview.options.display(
      <CoordinateConverter
        columns={this.wbview.dataset.columns}
        coordinateColumns={this.wbview.mappings.coordinateColumns}
        data={this.wbview.data}
        hot={this.wbview.hot}
        onClose={() => this.wbview.coordinateConverterView()}
      />,
      undefined,
      () => {
        this.wbview.coordinateConverterView = undefined;
        buttons.map(([button, isDisabled]) => (button.disabled = isDisabled));
        this.wbview.hot.updateSettings({
          readOnly: originalReadOnlyState,
        });
        this.wbview.isReadOnly = originalReadOnlyState;
        this.el.classList.remove('wb-focus-coordinates');
      }
    );
  },
});
