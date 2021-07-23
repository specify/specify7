const $ = require('jquery');
const _ = require('underscore');
const Leaflet = require('./leaflet');
const WbLocalityDataExtractor = require('./wblocalitydataextractor');
const Backbone = require('./backbone.js');
const latlongutils = require('./latlongutils.js');
const WbPlanViewHelper = require('./wbplanviewhelper');
const { findLocalityColumnsInDataSet } = require('./wblocalitydataextractor');
const {
  default: WbAdvancedSearch,
  getInitialSearchPreferences,
} = require('./components/wbadvancedsearch');
const {default: localityText} = require('./localization/locality');
const wbText = require('./localization/workbench').default;
const commonText = require('./localization/common').default;

module.exports = Backbone.View.extend({
  __name__: 'WbUtils',
  className: 'wbs-utils',
  events: {
    'click .wb-cell-navigation': 'navigateCells',
    'click .wb-navigation-text': 'toggleCellTypes',
    'keydown .wb-search-query': 'searchCells',
    'keydown .wb-replace-value': 'replaceCells',
    'click .wb-advanced-search': 'showAdvancedSearch',
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
    this.advancedSearch = undefined;
    this.geoLocateDialog = undefined;
    this.geoMapDialog = undefined;
    this.searchCells = _.debounce(
      this.searchCells,
      Math.ceil(Math.min(200, Math.max(10, this.wbview.data.length / 20))),
      false
    );
  },
  render() {
    return this;
  },
  getSelectedLast() {
    let [currentRow, currentCol] = this.wbview.hot.getSelectedLast() ?? [0, 0];
    /*
     * this.wbview.getSelectedLast() returns -1 when column's header or row's
     * number cell is selected
     * */
    if (currentRow < 0) currentRow = 0;
    if (currentCol < 0) currentCol = 0;
    return [currentRow, currentCol];
  },
  cellIsType(metaArray, type) {
    switch (type) {
      case 'invalidCells':
        return this.wbview.getCellMetaFromArray(metaArray, 'issues').length > 0;
      case 'newCells':
        return this.wbview.getCellMetaFromArray(metaArray, 'isNew');
      case 'modifiedCells':
        return this.wbview.getCellMetaFromArray(metaArray, 'isModified');
      case 'searchResults':
        return this.wbview.getCellMetaFromArray(metaArray, 'isSearchResult');
      default:
        return false;
    }
  },
  navigateCells(event, matchCurrentCell = false, currentCell = undefined) {
    const button = event.target;
    const direction = button.getAttribute('data-navigation-direction');
    const buttonParent = button.parentElement;
    const type = buttonParent.getAttribute('data-navigation-type');
    const currentPositionElement = buttonParent.getElementsByClassName(
      'wb-navigation-position'
    )[0];
    const totalCountElement = buttonParent.getElementsByClassName(
      'wb-navigation-total'
    )[0];
    const totalCount = parseInt(totalCountElement.innerText);

    const cellMetaObject = this.wbview.getCellMetaObject();

    const orderIt =
      direction === 'next'
        ? (array) => array
        : (array) => Array.from(array).reverse();

    let matchedCell;
    let cellIsTypeCount = 0;

    const resolveIndex = (visualRow, visualCol, first) =>
      (this.searchPreferences.navigation.direction === 'rowFirst') === first
        ? visualRow
        : visualCol;

    const [currentRow, currentCol] = currentCell ?? this.getSelectedLast();

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

    /*
     * The cellMetaObject is transposed if navigation direction is "Column
     * first".
     * In that case, the meaning of visualRow and visualCol is swapped.
     * resolveIndex exists to resolve the canonical visualRow/visualCol
     */
    orderIt(Object.entries(cellMetaObject)).find(([visualRowString, metaRow]) =>
      orderIt(Object.entries(metaRow)).find(([visualColString, metaArray]) => {
        // This is 10 times faster then Number.parseInt because of a slow
        // Babel polyfill
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
      })
    );

    let cellRelativePosition;
    if (typeof matchedCell === 'undefined') cellRelativePosition = 0;
    else if (direction === 'next') cellRelativePosition = cellIsTypeCount;
    else cellRelativePosition = totalCount - cellIsTypeCount + 1;

    const boundaryCell = direction === 'next' ? totalCount : 1;

    const initialCellRelativePosition = parseInt(
      currentPositionElement.innerText || '0'
    );
    if (
      cellRelativePosition !== 0 ||
      initialCellRelativePosition !== boundaryCell ||
      totalCount === 0
    )
      currentPositionElement.innerText = cellRelativePosition;

    if (typeof matchedCell === 'undefined') return false;

    this.wbview.hot.selectCell(matchedCell.visualRow, matchedCell.visualCol);

    // Turn on the respective cell type if it was hidden
    this.toggleCellTypes(event, 'remove');

    return [matchedCell.visualRow, matchedCell.visualCol];
  },
  toggleCellTypes(e, action = 'toggle') {
    let navigationType;
    let buttonContainer;
    if (typeof e === 'string') {
      navigationType = e;
      buttonContainer = this.el.querySelector(
        `.wb-navigation-section[data-navigation-type="${navigationType}"]`
      );
    } else {
      const button = e.target;
      buttonContainer = button.closest('.wb-navigation-section');
      navigationType = buttonContainer.getAttribute('data-navigation-type');
    }
    const groupName = WbPlanViewHelper.camelToKebab(navigationType);
    const cssClassName = `wb-hide-${groupName}`;
    this.el.classList[action](cssClassName);
    const newState = this.el.classList.contains(cssClassName);
    buttonContainer.getElementsByClassName(
      'wb-navigation-text'
    )[0].ariaPressed = newState;
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
        this.searchQuery = RegExp(
          this.searchQuery,
          this.searchPreferences.search.caseSensitive ? '' : 'i'
        );
      } catch (error) {
        searchQueryElement.classList.add('wb-search-query-invalid');
        searchQueryElement.setAttribute('title', error.toString());
        this.searchQuery = undefined;
        return;
      }
    else if (!this.searchPreferences.search.caseSensitive)
      this.searchQuery = this.searchQuery.toLowerCase();

    searchQueryElement.classList.remove('wb-search-query-invalid');
    searchQueryElement.removeAttribute('title');

    return this.searchQuery;
  },
  async searchCells(event) {
    const searchQueryElement =
      this.el.getElementsByClassName('wb-search-query')[0];

    if (
      searchQueryElement.value === this.rawSearchQuery &&
      !['SettingsChange', 'Enter'].includes(event.key)
    )
      return;

    if (event.key !== 'Enter' && !this.searchPreferences.search.liveUpdate)
      return;

    const navigationContainer = this.el.querySelector(
      '.wb-navigation-section[data-navigation-type="searchResults"]'
    );
    const navigationTotalElement = navigationContainer.getElementsByClassName(
      'wb-navigation-total'
    )[0];

    if (typeof this.parseSearchQuery() === 'undefined') {
      navigationTotalElement.innerText = '0';
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
        const cellData = data[physicalRow][physicalCol] || '';
        const searchValue = cellData
          ? cellData
          : this.wbview.mappings?.defaultValues[physicalCol] ?? '';
        const isSearchResult = this.searchFunction(searchValue);

        let cell = undefined;
        let render = false;

        /*
         * Calling this.wbview.hot.getCell only if cell is within the render
         * bounds.
         * While hot.getCell is supposed to check for this too, doing it this
         * way makes search about 25% faster
         * */
        if (
          firstVisibleRow <= visualRow &&
          lastVisibleRow >= visualRow &&
          firstVisibleColumn <= visualCol &&
          lastVisibleColumn >= visualCol
        ) {
          cell = this.wbview.hot.getCell(visualRow, visualCol);
          render = !!cell;
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

    navigationTotalElement.innerText = resultsCount;

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
      : (cellValue) => cellValue.split(this.searchQuery).join(replacementValue);

    if (this.searchPreferences.replace.replaceMode === 'replaceAll') {
      const modifications = [];
      Object.entries(this.wbview.cellMeta).forEach(([physicalRow, metaRow]) =>
        Object.entries(metaRow).forEach(([physicalCol, metaArray]) => {
          if (!this.wbview.getCellMetaFromArray(metaArray, 'isSearchResult'))
            return;
          const visualRow = this.wbview.hot.toVisualRow(
            Number.parseInt(physicalRow)
          );
          const visualCol = this.wbview.hot.toVisualColumn(
            Number.parseInt(physicalCol)
          );
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
      const [currentRow, currentCol] = this.getSelectedLast();
      const physicalRow = this.wbview.hot.toPhysicalRow(currentRow);
      const physicalCol = this.wbview.hot.toPhysicalColumn(currentCol);
      let nextCell;
      if (
        this.cellIsType(
          this.wbview.cellMeta[physicalRow]?.[physicalCol],
          'searchResults'
        )
      )
        nextCell = [currentRow, currentCol];
      else nextCell = nextCellOfType();

      if (!Array.isArray(nextCell)) return;

      this.wbview.hot.setDataAtCell(
        ...nextCell,
        getNewCellValue(this.wbview.hot.getDataAtCell(...nextCell))
      );

      nextCellOfType();
    }
  },
  showAdvancedSearch(event) {
    if (typeof this.advancedSearch !== 'undefined') {
      this.advancedSearch.remove();
      return;
    }

    event.target.ariaPressed = true;

    let initialNavigationDirection =
      this.searchPreferences.navigation.direction;
    this.advancedSearch = new WbAdvancedSearch({
      initialSearchPreferences: this.searchPreferences,
      onChange: (newSearchPreferences) => {
        this.searchPreferences = newSearchPreferences;
        if (
          this.searchPreferences.navigation.direction !==
          initialNavigationDirection
        ) {
          this.wbview.flushIndexedCellData = true;
          initialNavigationDirection =
            this.searchPreferences.navigation.direction;
        }
        if (this.searchPreferences.search.liveUpdate) {
          this.searchCells({
            key: 'SettingsChange',
          });
        }
      },
      onClose: () => {
        this.advancedSearch.remove();
        this.advancedSearch = undefined;
        event.target.ariaPressed = false;
      },
    }).render();
  },
  searchFunction(initialCellValue) {
    let cellValue = initialCellValue ?? '';

    if (typeof this.searchQuery === 'undefined') return false;

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
    event.target.ariaPressed = toolkit.style.display === 'none';
    toolkit.style.display = toolkit.style.display === 'none' ? '' : 'none';
    this.wbview.handleResize();
  },
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
  fillCellsContextMenuItem(name, handlerFunction, isDisabled) {
    return {
      name: name,
      disabled: () =>
        isDisabled() ||
        (this.wbview.hot
          .getSelected()
          ?.every((selection) => selection[0] === selection[2]) ??
          false),
      callback: (_, selections) =>
        selections.forEach((selection) =>
          [
            ...Array(selection.end.col + 1 - selection.start.col).keys(),
          ].forEach((index) =>
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
          this.wbview.mappings.baseTableName,
          this.wbview.mappings.arrayOfMappings
        )
      : [];

    const leafletButton = this.el.getElementsByClassName('wb-leafletmap')[0];
    const geoLocaleButton = this.el.getElementsByClassName('wb-geolocate')[0];
    const coordinateConverterButton = this.el.getElementsByClassName(
      'wb-convert-coordinates'
    )[0];

    if (this.localityColumns.length !== 0) {
      leafletButton.disabled = false;
      if (this.wbview.isUploaded) {
        [geoLocaleButton, coordinateConverterButton].map((button) =>
          button.setAttribute('title', wbText('unavailableWhenUploaded'))
        );
      } else {
        geoLocaleButton.disabled = false;
        coordinateConverterButton.disabled = false;
      }
    }
  },
  getVisualHeaders() {
    return this.wbview.dataset.columns.map(
      (_, index, columns) => columns[this.wbview.hot.toPhysicalColumn(index)]
    );
  },
  getGeoLocateQueryURL({ localityColumns, visualRow }) {
    let queryString = '';
    const visualHeaders = this.getVisualHeaders();

    const localityData =
      WbLocalityDataExtractor.getLocalityCoordinate(
        this.wbview.hot.getDataAtRow(visualRow),
        visualHeaders,
        localityColumns
      ) || {};

    if (localityData['locality.geography.$Country.name'])
      queryString += `&country=${localityData['locality.geography.$Country.name'].value}`;
    if (localityData['locality.geography.$State.name'])
      queryString += `&state=${localityData['locality.geography.$State.name'].value}`;
    if (localityData['locality.geography.$County.name'])
      queryString += `&county=${localityData['locality.geography.$County.name'].value}`;
    if (localityData['locality.localityname'])
      queryString += `&locality=${localityData['locality.localityname'].value}`;
    if (
      localityData['locality.latitude1'] &&
      localityData['locality.longitude1']
    )
      queryString += `&points=${localityData['locality.latitude1'].value}|${localityData['locality.longitude1'].value}`;

    return `https://www.geo-locate.org/web/WebGeoreflight.aspx?v=1&w=900&h=400&georef=run${queryString}`;
  },
  getSelectedRegions() {
    const selectedRegions = this.wbview.hot.getSelected() || [[0, 0, 0, 0]];

    return selectedRegions
      .map((values) => values.map((value) => Math.max(0, value)))
      .map(([startRow, startCol, endRow, endCol]) =>
        startRow < endRow
          ? { startRow, startCol, endRow, endCol }
          : { endRow, startCol, startRow, endCol }
      )
      .map(({ startCol, endCol, ...rest }) =>
        startCol < endCol
          ? { startCol, endCol, ...rest }
          : { startCol: endCol, endCol: startCol, ...rest }
      );
  },
  showGeoLocate(event) {

    if(typeof this.geoLocateDialog !== 'undefined'){
      this.geoLocateDialog.dialog('close');
      return;
    }

    event.target.ariaPressed = true;

    const selectedRegions = this.getSelectedRegions();

    const selectedHeaders = [
      ...new Set(
        selectedRegions.flatMap(({ startCol, endCol }) =>
          Array.from(
            { length: endCol - startCol + 1 },
            (_, index) => startCol + index
          )
        )
      ),
    ]
      .sort()
      .map(
        (visualCol) =>
          this.wbview.dataset.columns[
            this.wbview.hot.toPhysicalColumn(visualCol)
          ]
      );

    const localityColumnGroups =
      WbLocalityDataExtractor.getLocalityColumnsFromSelectedCells(
        this.localityColumns,
        selectedHeaders
      );

    if (localityColumnGroups.length === 0) return;

    const selectedRows = [
      ...new Set(
        selectedRegions.flatMap(({ startRow, endRow }) =>
          Array.from(
            { length: endRow - startRow + 1 },
            (_, index) => startRow + index
          )
        )
      ),
    ].sort();

    let localityIndex = 0;

    const parseLocalityIndex = (localityIndex) => ({
      localityColumns:
        localityColumnGroups[localityIndex % localityColumnGroups.length],
      visualRow:
        selectedRows[Math.floor(localityIndex / localityColumnGroups.length)],
    });

    const getGeoLocateQueryURL = (localityIndex) =>
      this.getGeoLocateQueryURL(parseLocalityIndex(localityIndex));

    this.geoLocateDialog = $(`<div />`, { id: 'geolocate-window' }).dialog({
      width: 960,
      height: 740,
      title: wbText('geoLocateDialogTitle'),
      close: function () {
        $(this).remove();
        window.removeEventListener('message', handleGeolocateResult, false);
        event.target.ariaPressed = false;
        this.geoLocateDialog = undefined;
      },
    });

    const updateGeolocate = (localityIndex) =>
      this.geoLocateDialog.html(`<iframe
        style="
            width: 100%;
            height: 100%;
            border: none;"
        src="${getGeoLocateQueryURL(localityIndex)}"
        title="${wbText('geoLocate')}"></iframe>`);

    const updateSelectedRow = (localityIndex) =>
      this.wbview.hot.selectRows(parseLocalityIndex(localityIndex).visualRow);

    const updateButtons = (localityIndex) =>
      this.geoLocateDialog.dialog('option', 'buttons', [
        {
          text: commonText('previous'),
          click: () => updateGeoLocate(localityIndex - 1),
          disabled: localityIndex === 0,
        },
        {
          text: commonText('next'),
          click: () => updateGeoLocate(localityIndex + 1),
          disabled:
            localityIndex + 1 >=
            selectedRows.length * localityColumnGroups.length,
        },
      ]);

    function updateGeoLocate(newLocalityIndex) {
      localityIndex = newLocalityIndex;
      updateGeolocate(newLocalityIndex);
      updateSelectedRow(newLocalityIndex);
      updateButtons(newLocalityIndex);
    }
    updateGeoLocate(localityIndex);

    const visualHeaders = this.getVisualHeaders();
    const handleGeolocateResult = (event) => {
      const dataColumns = event.data?.split('|') ?? [];
      if (dataColumns.length !== 4 || event.data === '|||') return;

      const { visualRow, localityColumns } = parseLocalityIndex(localityIndex);

      this.wbview.hot.setDataAtCell(
        [
          'locality.latitude1',
          'locality.longitude1',
          'locality.latlongaccuracy',
        ]
          .map((fieldName, index) => [
            visualRow,
            visualHeaders.indexOf(localityColumns[fieldName]),
            dataColumns[index],
          ])
          .filter(([, visualCol]) => visualCol !== -1)
      );

      if (selectedRows.length * localityColumnGroups.length === 1)
        dialog.dialog('close');
    };

    window.addEventListener('message', handleGeolocateResult, false);
  },
  showLeafletMap(event) {

    if(typeof this.geoMapDialog !== 'undefined'){
      this.geoMapDialog.dialog('close');
      return;
    }
    event.target.ariaPressed = true;

    const selectedRegions = this.getSelectedRegions();
    let customRowNumbers = [];
    const rows = selectedRegions.every(
      ({ startCol, endCol }) =>
        startCol === -1 ||
        (startCol === 0 && endCol === this.wbview.dataset.columns.length - 1)
    )
      ? selectedRegions.flatMap(({ startRow, endRow }) =>
          Array.from({ length: endRow - startRow + 1 }, (_, index) => {
            customRowNumbers.push(startRow + index);
            return this.wbview.hot.getDataAtRow(startRow + index);
          })
        )
      : this.wbview.hot.getData();

    const localityPoints =
      WbLocalityDataExtractor.getLocalitiesDataFromSpreadsheet(
        this.localityColumns,
        rows,
        this.getVisualHeaders(),
        customRowNumbers
      );

    const dialog = document.createElement('div');
    Leaflet.showLeafletMap({
      localityPoints,
      markerClickCallback: (localityPoint) => {
        const rowNumber = localityPoints[localityPoint].rowNumber.value;
        const [_currentRow, currentCol] = this.getSelectedLast();
        this.wbview.hot.scrollViewportTo(rowNumber, currentCol);
        // select entire row
        this.wbview.hot.selectRows(rowNumber);
      },
      leafletMapContainer: dialog,
    });
    this.geoMapDialog = $(dialog);
    this.geoMapDialog.on('dialogbeforeclose',()=>{
      this.geoMapDialog=undefined;
      event.target.ariaPressed = false;
    })
  },
  showCoordinateConversion() {
    if (typeof this.wbview.coordinateConverterView !== 'undefined') return;

    // List of coordinate columns
    const columnsToWorkWith = Object.keys(
      this.wbview.mappings.coordinateColumns
    ).map((physicalCol) =>
      this.wbview.hot.toVisualColumn(Number.parseInt(physicalCol))
    );

    if (columnsToWorkWith.length === 0)
      throw new Error('Unable to find Coordinate columns');

    let selectedRegions;
    let selectedCells;
    const getSelectedCells = () => {
      if (
        JSON.stringify(this.getSelectedRegions()) ===
        JSON.stringify(selectedRegions)
      )
        return selectedCells;

      selectedRegions = this.getSelectedRegions();
      selectedCells = selectedRegions
        .flatMap(({ startRow, endRow, startCol, endCol }) =>
          Array.from({ length: endRow - startRow + 1 }, (_, rowIndex) =>
            Array.from({ length: endCol - startCol + 1 }, (_, colIndex) => [
              startRow + rowIndex,
              startCol + colIndex,
            ])
          )
        )
        .flat()
        .reduce((indexedCells, [visualRow, visualCol]) => {
          if (!columnsToWorkWith.includes(visualCol)) return indexedCells;
          indexedCells[visualRow] ??= new Set();
          indexedCells[visualRow].add(visualCol);
          return indexedCells;
        }, {});
      return selectedCells;
    };

    if (Object.keys(getSelectedCells()).length === 0)
      this.wbview.hot.scrollViewportTo(
        this.getSelectedLast()[0],
        columnsToWorkWith[0]
      );

    const toPhysicalCol = this.wbview.dataset.columns.map((_, visualCol) =>
      this.wbview.hot.toPhysicalColumn(visualCol)
    );

    const originalState = columnsToWorkWith.flatMap((visualCol) =>
      Array.from({ length: this.wbview.hot.countRows() }, (_, visualRow) => {
        const physicalRow = this.wbview.hot.toPhysicalRow(visualRow);
        const physicalCol = toPhysicalCol[visualCol];
        return [
          visualRow,
          visualCol,
          this.wbview.data[physicalRow][physicalCol],
        ];
      })
    );

    const buttons = [
      'wb-leafletmap',
      'wb-geolocate',
      'wb-convert-coordinates',
      'wb-replace-value',
    ]
      .map((className) => this.el.getElementsByClassName(className)[0])
      .map((button) => [button, button.disabled]);
    const originalReadOnlyState = this.wbview.readOnly;
    this.wbview.hot.updateSettings({
      readOnly: true,
    });
    this.el.classList.add('wb-focus-coordinates');

    let numberOfChanges = 0;
    function cleanUp() {
      buttons.map(([button, isDisabled]) => (button.disabled = isDisabled));
      this.wbview.hot.updateSettings({
        readOnly: originalReadOnlyState,
      });
      this.wbview.readOnly = originalReadOnlyState;
      this.el.classList.remove('wb-focus-coordinates');
    }

    let handleOptionChangeBind = undefined;

    function closeDialog() {
      this.wbview.coordinateConverterView[0].removeEventListener(
        'change',
        handleOptionChangeBind
      );
      this.wbview.coordinateConverterView.remove();
      this.wbview.coordinateConverterView = undefined;
      cleanUp.call(this);
    }

    const options = [
      {
        optionName: 'DD.DDDD (32.7619)',
        conversionFunctionName: 'toDegs',
        showCardinalDirection: false,
      },
      {
        optionName: 'DD MMMM (32. 45.714)',
        conversionFunctionName: 'toDegsMins',
        showCardinalDirection: false,
      },
      {
        optionName: 'DD MM SS.SS (32 45 42.84)',
        conversionFunctionName: 'toDegsMinsSecs',
        showCardinalDirection: false,
      },
      {
        optionName: 'DD.DDDD N/S/E/W (32.7619 N)',
        conversionFunctionName: 'toDegs',
        showCardinalDirection: true,
      },
      {
        optionName: 'DD MM.MM N/S/E/W (32 45.714 N)',
        conversionFunctionName: 'toDegsMins',
        showCardinalDirection: true,
      },
      {
        optionName: 'DD MM SS.SS N/S/E/W (32 45 42.84 N)',
        conversionFunctionName: 'toDegsMinsSecs',
        showCardinalDirection: true,
      },
    ];

    function revertChanges() {
      this.wbview.hot.batch(() =>
        Array.from({ length: numberOfChanges }).forEach(() =>
          this.wbview.hot.undo()
        )
      );
      closeDialog.call(this);
    }

    this.wbview.coordinateConverterView = $(`<div>
      ${wbText('coordinateConverterDialogHeader')}
      <ul class="lat-long-format-options">
        ${Object.values(options)
          .map(
            ({ optionName }, optionIndex) =>
              `<li>
                <label>
                  <input
                    type="radio"
                    name="latlongformat"
                    value="${optionIndex}"
                  >
                  ${optionName}
                </label>
              </li>`
          )
          .join('')}
        <li>
          <br>
          <label>
            <input type="checkbox" name="includesymbols">
            ${wbText('includeDmsSymbols')}
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" name="applyToAll" checked>
            ${commonText('applyAll')}
          </label>
        </li>
      </ul>
    </div>`).dialog({
      title: wbText('coordinateConverterDialogTitle'),
      close: revertChanges.bind(this),
      width: 350,
      buttons: [
        {
          text: commonText('cancel'),
          click: revertChanges.bind(this),
        },
        { text: commonText('apply'), click: closeDialog.bind(this) },
      ],
    });

    const handleOptionChange = () => {
      const includeSymbols = this.wbview.coordinateConverterView
        .find('input[name="includesymbols"]')
        .is(':checked');
      const applyToAll = this.wbview.coordinateConverterView
        .find('input[name="applyToAll"]')
        .is(':checked');

      const selectedOption = this.wbview.coordinateConverterView.find(
        'input[type="radio"]:checked'
      );
      if (selectedOption.length === 0) return;

      const optionValue = selectedOption.attr('value');
      if (typeof options[optionValue] === 'undefined') return;

      const { conversionFunctionName, showCardinalDirection } =
        options[optionValue];
      const includeSymbolsFunction = includeSymbols
        ? (coordinate) => coordinate
        : (coordinate) => coordinate.replace(/[^\w\s\-.]/gm, '');
      const lastChar = (value) => value[value.length - 1];
      const removeLastChar = (value) => value.slice(0, -1);
      const endsWith = (value, charset) =>
        charset.indexOf(lastChar(value)) !== -1;
      const stripCardinalDirections = (finalValue) =>
        showCardinalDirection
          ? finalValue
          : endsWith(finalValue, 'SW')
          ? '-' + removeLastChar(finalValue)
          : endsWith(finalValue, 'NE')
          ? removeLastChar(finalValue)
          : finalValue;

      const selectedCells = getSelectedCells();
      const changes = originalState
        .map(([visualRow, visualCol, originalValue]) => {
          let value = originalValue;
          if (applyToAll || selectedCells[visualRow]?.has(visualCol)) {
            const columnRole =
              this.wbview.mappings.coordinateColumns[toPhysicalCol[visualCol]];
            const coordinate = latlongutils[columnRole].parse(originalValue);
            if (coordinate)
              value = includeSymbolsFunction(
                stripCardinalDirections(
                  coordinate[conversionFunctionName]().format()
                )
              ).trim();
          }
          return [visualRow, visualCol, value];
        })
        .filter(([visualRow, visualCol, value]) => {
          const physicalRow = this.wbview.hot.toPhysicalRow(visualRow);
          const physicalCol = toPhysicalCol[visualCol];
          return value !== this.wbview.data[physicalRow][physicalCol];
        });
      if (changes.length > 0) {
        numberOfChanges += 1;
        this.wbview.hot.setDataAtCell(changes);
      }
    };
    handleOptionChangeBind = handleOptionChange.bind(this);
    this.wbview.coordinateConverterView[0].addEventListener(
      'change',
      handleOptionChangeBind
    );
  },
});
