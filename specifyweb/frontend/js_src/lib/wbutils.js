const $ = require('jquery');
const Leaflet = require('./leaflet.ts');
const WbLocalityDataExtractor = require('./wblocalitydataextractor.ts');
const Backbone = require('./backbone.js');
const latlongutils = require('./latlongutils.js');
const WbPlanViewHelper = require('./wbplanviewhelper.ts');
const WbPlanViewModel = require('./wbplanviewmodel.ts').default;
const {
  findLocalityColumnsInDataSet,
} = require('./wblocalitydataextractor.ts');
const {
  default: WbAdvancedSearch,
  getInitialSearchPreferences,
} = require('./components/wbadvancedsearch.tsx');

const LIVE_SEARCH_THROTTLE = 50;

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
    this.searchQuery = '';
    this.searchPreferences = getInitialSearchPreferences();
    this.advancedSearch = undefined;
    this.queuedSearch = undefined;
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
  cellIsType(cellMeta, type) {
    switch (type) {
      case 'invalidCells':
        return Array.isArray(cellMeta.issues) && cellMeta.issues.length > 0;
      case 'newCells':
        return cellMeta.isNew === true;
      case 'modifiedCells':
        return cellMeta.isModified !== false;
      case 'searchResults':
        return cellMeta.isSearchResult === true;
      default:
        return false;
    }
  },
  navigateCells(e, matchCurrentCell = false, currentCell = undefined) {
    const button = e.target;
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

    const [currentRow, currentCol] = currentCell ?? this.getSelectedLast();

    const cellMetaObject = this.wbview.getCellMetaObject();

    const orderIt =
      direction === 'next' ? (array) => array : (array) => [...array].reverse();

    let matchedCell;
    let cellIsTypeCount = 0;

    const getPosition = (visualRow, visualCol, first) =>
      (this.searchPreferences.navigation.direction === 'rowFirst') === first
        ? visualRow
        : visualCol;

    const getCurrentPosition = (first) =>
      getPosition(currentRow, currentCol, first);

    const compareRows =
      direction === 'next'
        ? (visualRow) => visualRow >= getCurrentPosition(true)
        : (visualRow) => visualRow <= getCurrentPosition(true);

    const compareCols =
      direction === 'next'
        ? matchCurrentCell
          ? (visualCol) => visualCol >= getCurrentPosition(false)
          : (visualCol) => visualCol > getCurrentPosition(false)
        : matchCurrentCell
        ? (visualCol) => visualCol <= getCurrentPosition(false)
        : (visualCol) => visualCol < getCurrentPosition(false);

    /*
     * The cellMetaObject is transposed when navigation direction changes
     * In that case, the meaning of visualRow and visualCol is swapped
     * getPosition exists to resolve the canonical visualRow/visualCol
     */
    orderIt(Object.entries(cellMetaObject)).find(([visualRow, metaRow]) =>
      orderIt(Object.entries(metaRow)).find(([visualCol, cellMeta]) => {
        visualRow = Number.parseInt(visualRow);
        visualCol = Number.parseInt(visualCol);
        const cellTypeMatches = this.cellIsType(cellMeta, type);
        cellIsTypeCount += cellTypeMatches;
        const foundIt =
          cellTypeMatches &&
          compareRows(visualRow) &&
          (visualRow !== getCurrentPosition(true) || compareCols(visualCol));
        [realVisualRow, realVisualCol] = [
          getPosition(visualRow, visualCol, true),
          getPosition(visualRow, visualCol, false),
        ];
        if (foundIt)
          matchedCell = { visualRow: realVisualRow, visualCol: realVisualCol };
        return foundIt;
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

    return [matchedCell.visualRow, matchedCell.visualCol];
  },
  toggleCellTypes(e) {
    const button = e.target;
    const buttonContainer = button.closest('.wb-navigation-section');
    const buttonLabel = buttonContainer.getAttribute('data-navigation-type');
    const cssClassName = `wb-hide-${WbPlanViewHelper.camelToKebab(
      buttonLabel
    )}`;
    this.el.classList.toggle(cssClassName);
  },
  searchCells(e) {
    if (e.key !== 'Enter' && e.key !== 'Live') {
      if (this.searchPreferences.search.liveUpdate) {
        // Throttle live search down to once every few ms
        if (typeof this.queuedSearch !== 'undefined')
          clearTimeout(this.queuedSearch);
        this.queuedSearch = setTimeout(() => {
          this.searchCells({ target: e.target, key: 'Live' });
          this.queuedSearch = undefined;
        }, LIVE_SEARCH_THROTTLE);
      }
      return;
    }

    this.el.classList.remove('wb-hide-search-results');

    const button = e.target;
    const buttonContainer = button.parentElement;
    const navigationContainer =
      this.el.getElementsByClassName('wb-navigation')[0];
    const navigationTotalElement = navigationContainer.getElementsByClassName(
      'wb-navigation-total'
    )[0];
    const searchQueryElement =
      buttonContainer.getElementsByClassName('wb-search-query')[0];
    const navigationButton =
      navigationContainer.getElementsByClassName('wb-cell-navigation');

    this.searchQuery = this.searchPreferences.search.useRegex
      ? searchQueryElement.value
      : searchQueryElement.value.trim();

    if (this.searchQuery === '') {
      navigationTotalElement.innerText = '0';
      return;
    }

    let resultsCount = 0;
    const rowCount = this.wbview.hot.countRows();
    const toPhysicalCol = Array.from(
      { length: this.wbview.dataset.columns.length },
      (_, visualCol) => this.wbview.hot.toPhysicalColumn(visualCol)
    );
    const data = this.wbview.dataset.rows;
    for (let visualRow = 0; visualRow < rowCount; visualRow++) {
      const physicalRow = this.wbview.hot.toPhysicalRow(visualRow);
      for (
        let visualCol = 0;
        visualCol < this.wbview.dataset.columns.length;
        visualCol++
      ) {
        const physicalCol = toPhysicalCol[visualCol];
        const cellData = data[physicalRow][physicalCol] || '';
        const searchValue = cellData
          ? cellData
          : this.wbview.mappings.defaultValues[physicalCol] ?? '';
        const testResult = this.searchFunction(this.searchQuery, searchValue);
        this.searchCallback(physicalRow, physicalCol, testResult);
        if (testResult) resultsCount += 1;
      }
    }

    navigationTotalElement.innerText = resultsCount;

    if (e.key === 'Enter')
      this.navigateCells(
        { target: navigationButton[1] },
        e.key === 'Enter',
        e.key === 'Enter' ? [0, 0] : undefined
      );
  },
  replaceCells(e) {
    if (e.key !== 'Enter') return;

    const button = e.target;
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
        Object.entries(metaRow).forEach(([physicalCol, cellMeta]) => {
          if (!cellMeta.isSearchResult) return;
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
          this.wbview.cellMeta[physicalRow][physicalCol],
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
  showAdvancedSearch() {
    if (typeof this.advancedSearch !== 'undefined') return;

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
          this.searchCells(
            {
              target: this.el.getElementsByClassName('wb-search-query')[0],
              key: 'Live',
            },
            false
          );
        }
      },
      onClose: () => {
        this.advancedSearch = undefined;
      },
    }).render();
  },
  searchFunction(initialSearchQuery, initialCellValue) {
    let cellValue = initialCellValue;
    let searchQuery = initialSearchQuery;

    if (cellValue === null) cellValue = '';

    if (!this.searchPreferences.search.caseSensitive) {
      cellValue = cellValue.toLowerCase();
      searchQuery = searchQuery.toLowerCase();
    }

    if (this.searchPreferences.search.useRegex)
      try {
        return !!cellValue.match(
          RegExp(
            this.searchPreferences.search.fullMatch
              ? `^${searchQuery}$`
              : searchQuery,
            this.searchPreferences.search.caseSensitive ? 'i' : ''
          )
        );
      } catch (error) {
        // Ignore exceptions on invalid regex
        if (error instanceof SyntaxError) return;
        else throw error;
      }

    if (this.searchPreferences.search.fullMatch)
      return cellValue.trim() === searchQuery;
    else return cellValue.trim().includes(searchQuery);
  },
  searchCallback(physicalRow, physicalCol, testResult) {
    this.wbview.updateCellMeta(
      physicalRow,
      physicalCol,
      'isSearchResult',
      testResult
    );
  },
  toggleToolkit() {
    const toolkit = this.el.getElementsByClassName('wb-toolkit')[0];
    if (toolkit.style.display === 'none') toolkit.style.display = '';
    else toolkit.style.display = 'none';
    this.wbview.resize.bind(this.wbview)();
  },
  fillCells({ startRow, endRow, col, value }) {
    this.wbview.hot.setDataAtCell(
      [...Array(endRow - startRow).keys()].map((index) => [
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
  fillCellsContextMenuItem(name, handlerFunction) {
    return {
      name: name,
      disabled: () =>
        this.wbview.hot
          .getSelected()
          ?.every((selection) => selection[0] === selection[2]) ?? false,
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
    if (this.wbview.dataset.uploadplan === null) return;

    this.localityColumns = findLocalityColumnsInDataSet(
      this.wbview.mappings.baseTableName,
      this.wbview.mappings.arrayOfMappings
    );

    const leafletButton = this.el.getElementsByClassName('wb-leafletmap')[0];
    const geoLocaleButton = this.el.getElementsByClassName('wb-geolocate')[0];
    const coordinateConvertorButton = this.el.getElementsByClassName(
      'wb-convert-coordinates'
    )[0];

    if (this.localityColumns.length !== 0) {
      leafletButton.disabled = false;
      if (this.wbview.uploaded) {
        [geoLocaleButton, coordinateConvertorButton].map((button) =>
          button.setAttribute(
            'title',
            'This tool does not work with uploaded Data Sets'
          )
        );
      } else {
        geoLocaleButton.disabled = false;
        coordinateConvertorButton.disabled = false;
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

    const getValue = (fieldName) =>
      typeof localityColumns[fieldName] === 'undefined'
        ? ''
        : encodeURIComponent(
            this.wbview.hot.getDataAtCell(
              visualRow,
              visualHeaders.indexOf(localityColumns[fieldName])
            ) ?? ''
          );

    if (
      getValue('locality.geography.$Country.name') &&
      getValue('locality.geography.$State.name')
    ) {
      queryString = `country=${getValue(
        'locality.geography.$Country.name'
      )}&state=${getValue('locality.geography.$State.name')}`;

      if (getValue('locality.geography.$County.name'))
        queryString += `&county=${getValue('locality.geography.$County.name')}`;

      if (getValue('locality.localityname'))
        queryString += `&locality=${getValue('locality.localityname')}`;
    } else {
      const pointDataDict = WbLocalityDataExtractor.getLocalityCoordinate(
        this.wbview.hot.getDataAtRow(visualRow),
        visualHeaders,
        localityColumns
      );

      if (pointDataDict) {
        const {
          'locality.latitude1': { value: latitude1 },
          'locality.longitude1': { value: longitude1 },
          'locality.localityname': { value: localityname = '' } = { value: '' },
        } = pointDataDict;

        const pointDataList = [latitude1, longitude1];

        if (localityname !== '') pointDataList.push(localityname);

        queryString = `points=${pointDataList.join('|')}`;
      }
    }

    return `https://www.geo-locate.org/web/WebGeoreflight.aspx?v=1&w=900&h=400&${queryString}`;
  },
  getSelectedRegions() {
    const selectedRegions = this.wbview.hot.getSelected() || [[0, 0, 0, 0]];

    return selectedRegions
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
  showGeoLocate() {
    // don't allow opening more than one window)
    if ($('#geolocate-window').length !== 0) return;

    const selectedRegions = this.getSelectedRegions();

    const selectedHeaders = [
      ...new Set(
        selectedRegions.flatMap(({ startCol, endCol }) =>
          [...Array(endCol - startCol + 1)].map((_, index) => startCol + index)
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
      selectedHeaders.length === 1
        ? this.localityColumns
        : WbLocalityDataExtractor.getLocalityColumnsFromSelectedCells(
            this.localityColumns,
            selectedHeaders
          );

    if (localityColumnGroups.length === 0) return;

    const selectedRows = [
      ...new Set(
        selectedRegions.flatMap(({ startRow, endRow }) =>
          [...Array(endRow - startRow + 1)].map((_, index) => startRow + index)
        )
      ),
    ].sort();

    const rowIndexes =
      selectedRows.length === 1
        ? [...Array(this.wbview.hot.countCols())].map((_, index) => index)
        : selectedRows;

    let localityIndex =
      selectedRows.length === 1
        ? selectedRows[0] * localityColumnGroups.length
        : 0;

    const parseLocalityIndex = (localityIndex) => ({
      localityColumns:
        localityColumnGroups[localityIndex % localityColumnGroups.length],
      visualRow:
        rowIndexes[Math.floor(localityIndex / localityColumnGroups.length)],
    });

    const getGeoLocateQueryURL = (localityIndex) =>
      this.getGeoLocateQueryURL(parseLocalityIndex(localityIndex));

    const dialog = $(`<div />`, { id: 'geolocate-window' }).dialog({
      width: 960,
      height: 740,
      title: 'GEOLocate',
      close: function () {
        $(this).remove();
        window.removeEventListener('message', handleGeolocateResult, false);
      },
    });

    const updateGeolocate = (localityIndex) =>
      dialog.html(`<iframe
        style="
            width: 100%;
            height: 100%;
            border: none;"
        src="${getGeoLocateQueryURL(localityIndex)}"></iframe>`);

    const updateSelectedRow = (localityIndex) =>
      this.wbview.hot.selectRows(parseLocalityIndex(localityIndex).visualRow);

    const updateButtons = (localityIndex) =>
      dialog.dialog('option', 'buttons', [
        {
          text: 'Previous',
          click: () => updateGeoLocate(localityIndex - 1),
          disabled: localityIndex === 0,
        },
        {
          text: 'Next',
          click: () => updateGeoLocate(localityIndex + 1),
          disabled:
            localityIndex + 1 >=
            rowIndexes.length * localityColumnGroups.length,
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
      const dataColumns = event.data.split('|');
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
    };

    window.addEventListener('message', handleGeolocateResult, false);
  },
  showLeafletMap() {
    if ($('#leaflet-map').length !== 0) return;

    const selectedRegions = this.getSelectedRegions();
    let customRowNumbers = [];
    const rows = selectedRegions.every(
      ({ startCol, endCol }) =>
        startCol === -1 ||
        (startCol === 0 && endCol === this.wbview.dataset.columns.length - 1)
    )
      ? selectedRegions.flatMap(({ startRow, endRow }) =>
          [...Array(endRow - startRow + 1)].map((_, index) => {
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

    Leaflet.showLeafletMap({
      localityPoints,
      markerClickCallback: (localityPoint) => {
        const rowNumber = localityPoints[localityPoint].rowNumber.value;
        const [_currentRow, currentCol] = this.getSelectedLast();
        this.wbview.hot.scrollViewportTo(rowNumber, currentCol);
        // select an entire row
        this.wbview.hot.selectRows(rowNumber);
      },
      leafletMapContainer: 'leaflet-map',
    });
  },
  showCoordinateConversion() {
    if ($('.lat-long-format-options').length !== 0) return;

    if (Object.keys(this.wbview.mappings.coordinateColumns).length === 0)
      throw new Error('Unable to find Coordinate columnes');

    const [currentRow, currentCol] = this.getSelectedLast();
    if (
      !Object.keys(this.wbview.mappings.coordinateColumns).includes(
        currentCol.toString()
      )
    ) {
      const firstCoordinateColumn = Number.parseInt(
        Object.keys(this.wbview.mappings.coordinateColumns)[0]
      );
      this.wbview.hot.scrollViewportTo(currentRow, firstCoordinateColumn);
    }

    const buttons = [
      'wb-leafletmap',
      'wb-geolocate',
      'wb-convert-coordinates',
      'wb-replace-value',
    ]
      .map((className) => this.el.getElementsByClassName(className)[0])
      .map((button) => [button, button.disabled]);
    const originalReadOnlyState = this.wbview.readOnly;
    this.wbview.readOnly = true;
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
      dialog[0].removeEventListener('change', handleOptionChangeBind);
      dialog.remove();
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

    const dialog = $(
      `<ul class="lat-long-format-options">
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
            Include DMS Symbols
          </label>
        </li>
      </ul>`
    ).dialog({
      title: 'Change Geocoordinate Format',
      close: revertChanges.bind(this),
      width: 350,
      buttons: [
        {
          text: 'Cancel',
          click: revertChanges.bind(this),
        },
        { text: 'Apply', click: closeDialog.bind(this) },
      ],
    });

    const toVisualCol = this.wbview.dataset.columns.map((_, physicalCol) =>
      this.wbview.hot.toVisualColumn(physicalCol)
    );

    const handleOptionChange = () => {
      const includeSymbolsCheckbox = dialog.find(
        'input[name="includesymbols"]'
      );
      const includeSymbols = includeSymbolsCheckbox.is(':checked');

      const selectedOption = dialog.find('input[type="radio"]:checked');
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

      this.wbview.hot.setDataAtCell(
        Object.entries(this.wbview.mappings.coordinateColumns).flatMap(
          ([visualCol, columnRole]) =>
            this.wbview.hot
              .getDataAtCol(toVisualCol[visualCol])
              .map((cellValue, visualRow) => [
                latlongutils[columnRole].parse(cellValue),
                visualRow,
              ])
              .filter(([coordinate]) => coordinate !== null)
              .map(([coordinate, visualRow]) => [
                visualRow,
                toVisualCol[visualCol],
                includeSymbolsFunction(
                  stripCardinalDirections(
                    coordinate[conversionFunctionName]().format()
                  )
                ).trim(),
              ])
        )
      );

      numberOfChanges += 1;
    };
    handleOptionChangeBind = handleOptionChange.bind(this);
    dialog[0].addEventListener('change', handleOptionChangeBind);
  },
});
