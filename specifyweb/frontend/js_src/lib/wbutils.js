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
  navigateCells(e, matchCurrentCell = false) {
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

    const [currentRow, currentCol] = this.getSelectedLast();

    function cellIsType(cell) {
      switch (type) {
        case 'invalidCells':
          return Array.isArray(cell.issues) && cell.issues.length > 0;
        case 'newCells':
          return cell.isNew === true;
        case 'modifiedCells':
          return cell.isModified === true;
        case 'searchResults':
          return cell.isSearchResult === true;
        default:
          return false;
      }
    }

    const cellsMetaObject = this.wbview.getCellsMetaObject();

    const boolMatchCurrentCell =
      matchCurrentCell === 'ifIsSearchResult'
        ? cellIsType(cellsMetaObject[currentRow][currentCol])
        : matchCurrentCell;

    const orderIt =
      direction === 'next' ? (array) => array : (array) => [...array].reverse();

    const compareRows =
      direction === 'next'
        ? (visualRow) => visualRow >= currentRow
        : (visualRow) => visualRow <= currentRow;

    const compareCols =
      direction === 'next'
        ? boolMatchCurrentCell
          ? (visualCol) => visualCol >= currentCol
          : (visualCol) => visualCol > currentCol
        : boolMatchCurrentCell
        ? (visualCol) => visualCol <= currentCol
        : (visualCol) => visualCol < currentCol;

    let matchedCell;
    let cellIsTypeCount = 0;

    orderIt(Object.entries(cellsMetaObject)).find(([, cells]) =>
      orderIt(Object.values(cells)).find((cell) => {
        const cellTypeMatches = cellIsType(cell);
        cellIsTypeCount += cellTypeMatches;
        const foundIt =
          cellTypeMatches &&
          compareRows(cell.visualRow) &&
          (cell.visualRow !== currentRow || compareCols(cell.visualCol));
        if (foundIt) matchedCell = cell;
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

    this.wbview.hot.selectCell(
      matchedCell.visualRow,
      matchedCell.visualCol,
      matchedCell.visualRow,
      matchedCell.visualCol
    );

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
    const navigationContainer = this.el.getElementsByClassName(
      'wb-navigation'
    )[0];
    const navigationPositionElement = navigationContainer.getElementsByClassName(
      'wb-navigation-position'
    )[0];
    const navigationTotalElement = navigationContainer.getElementsByClassName(
      'wb-navigation-total'
    )[0];
    const searchQueryElement = buttonContainer.getElementsByClassName(
      'wb-search-query'
    )[0];
    const navigationButton = navigationContainer.getElementsByClassName(
      'wb-cell-navigation'
    );

    this.searchQuery = this.searchPreferences.search.useRegex
      ? searchQueryElement.value
      : searchQueryElement.value.trim();
    const searchPlugin = this.wbview.hot.getPlugin('search');
    const results =
      this.searchQuery === '' ? [] : searchPlugin.query(this.searchQuery);

    navigationTotalElement.innerText = results.length;

    if (
      e.key !== 'Live' &&
      !this.navigateCells({ target: navigationButton[1] }, 'ifIsSearchResult')
    )
      this.navigateCells({ target: navigationButton[0] }, true);
  },
  replaceCells(e) {
    if (e.key !== 'Enter') return;

    const cols = this.wbview.dataset.columns.length;
    const button = e.target;
    const buttonContainer = button.parentElement;
    const replacementValueElement = buttonContainer.getElementsByClassName(
      'wb-replace-value'
    )[0];
    const replacementValue = replacementValueElement.value;

    const getNewCellValue = this.searchPreferences.search.fullMatch
      ? () => replacementValue
      : (cellValue) => cellValue.split(this.searchQuery).join(replacementValue);

    if (this.searchPreferences.replace.replaceMode === 'replaceAll')
      this.wbview.hot.setDataAtCell(
        this.wbview
          .getCellsMeta()
          .filter((cell) => cell.isSearchResult)
          .map(({ visualRow, visualCol }) => [
            visualRow,
            visualCol,
            getNewCellValue(
              this.wbview.hot.getDataAtCell(visualRow, visualCol)
            ),
          ])
      );
    else {
      const nextCell = this.navigateCells(
        {
          target: document.querySelector(
            `.wb-navigation-section[data-navigation-type="searchResults"]
            .wb-cell-navigation[data-navigation-direction="next"]`
          ),
        },
        false
      );

      if (Array.isArray(nextCell))
        this.wbview.hot.setDataAtCell(
          ...nextCell,
          getNewCellValue(this.wbview.hot.getDataAtCell(...nextCell))
        );
    }
  },
  showAdvancedSearch() {
    if (typeof this.advancedSearch !== 'undefined') return;

    this.advancedSearch = new WbAdvancedSearch({
      initialSearchPreferences: this.searchPreferences,
      onChange: (newSearchPreferences) => {
        this.searchPreferences = newSearchPreferences;
        if (this.searchPreferences.search.liveUpdate) {
          this.searchCells({
            target: this.el.getElementsByClassName('wb-search-query')[0],
            key: 'Live',
          });
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
      return cellValue === searchQuery;
    else return cellValue.includes(searchQuery);
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
          button.title('This tool does not work with uploaded Data Sets')
        );
      } else {
        geoLocaleButton.disabled = false;
        coordinateConvertorButton.disabled = false;
      }
    }
  },
  getGeoLocateQueryURL(
    currentLocalityColumns,
    selectedRow,
    getDataAtCell,
    getDataAtRow
  ) {
    if (currentLocalityColumns === false) return;

    let queryString;

    if (
      typeof currentLocalityColumns.country !== 'undefined' &&
      typeof currentLocalityColumns.state !== 'undefined'
    ) {
      const data = Object.fromEntries(
        ['country', 'state', 'county', 'localityname'].map((columnName) => [
          columnName,
          typeof currentLocalityColumns[columnName] === 'undefined'
            ? undefined
            : encodeURIComponent(
                getDataAtCell(selectedRow, currentLocalityColumns[columnName])
              ),
        ])
      );

      queryString = `country=${data.country}&state=${data.state}`;

      if (typeof data.county !== 'undefined')
        queryString += `&county=${data.county}`;

      if (typeof data.localityname !== 'undefined')
        queryString += `&locality=${data.localityname}`;
    } else {
      const pointDataDict = WbLocalityDataExtractor.getLocalityCoordinate(
        getDataAtRow(selectedRow),
        this.wbview.dataset.columns,
        currentLocalityColumns
      );

      if (!pointDataDict) return;

      const {
        'locality.latitude1': latitude1,
        'locality.longitude1': longitude1,
        'locality.localityname': localityname = '',
      } = pointDataDict;

      const pointDataList = [latitude1, longitude1];

      if (localityname !== '') pointDataList.push(localityname);

      queryString = `points=${pointDataList.join('|')}`;
    }

    return `https://www.geo-locate.org/web/WebGeoreflight.aspx?v=1&w=900&h=400&${queryString}`;
  },
  showGeoLocate() {
    // don't allow opening more than one window)
    if ($('#geolocate-window').length !== 0) return;

    const selectedRegions = this.wbview.hot.getSelected() || [[0, 0, 0, 0]];
    const selections = selectedRegions.map(([startRow, column, endRow]) =>
      startRow < endRow
        ? [startRow, endRow, column]
        : [endRow, startRow, column]
    );
    const selectedCells = selections.flatMap(([startRow, endRow, column]) =>
      [...Array(endRow - startRow + 1)].map((_, index) =>
        [startRow + index, column].join(WbPlanViewModel.pathJoinSymbol)
      )
    );
    const uniqueSelectedCells = [...new Set(selectedCells)];
    const finalSelectedCells = uniqueSelectedCells.map((selectedCell) =>
      selectedCell
        .split(WbPlanViewModel.pathJoinSymbol)
        .map((index) => parseInt(index))
    );

    if (finalSelectedCells.length === 0) return;

    let currentCellIndex = 0;
    let geolocateQueryUrl = false;
    let currentLocalityColumns = [];

    let that = this;
    function updateGeolocateUrl() {
      currentLocalityColumns = WbLocalityDataExtractor.getLocalityColumnsFromSelectedCell(
        that.localityColumns,
        this.wbview.dataset.columns[
          this.wbview.hot.toPhysicalColumn(
            finalSelectedCells[currentCellIndex][1]
          )
        ]
      );

      geolocateQueryUrl = that.getGeoLocateQueryURL(
        currentLocalityColumns,
        finalSelectedCells[currentCellIndex][0],
        that.wbview.hot.getDataAtCell.bind(that.wbview.hot),
        that.wbview.hot.getDataAtRow.bind(that.wbview.hot)
      );
    }

    updateGeolocateUrl();

    if (geolocateQueryUrl === false) return;

    const handleAfterDialogClose = () =>
      window.removeEventListener('message', handleGeolocateResult, false);

    const dialog = $(`<div />`, { id: 'geolocate-window' }).dialog({
      width: 960,
      height: finalSelectedCells.length === 1 ? 680 : 740,
      title: 'GEOLocate',
      close: function () {
        $(this).remove();
        handleAfterDialogClose();
      },
    });

    const updateGeolocate = () =>
      dialog.html(`<iframe
        style="
            width: 100%;
            height: 100%;
            border: none;"
        src="${geolocateQueryUrl}"></iframe>`);
    updateGeolocate();

    const updateSelectedRow = () =>
      that.wbview.hot.selectRows(finalSelectedCells[currentCellIndex][0]);
    updateSelectedRow();

    function changeSelectedCell(newSelectedCell) {
      currentCellIndex = newSelectedCell;

      updateGeolocateUrl();

      if (geolocateQueryUrl === false) return;

      updateGeolocate();

      updateSelectedRow();

      updateButtons();
    }

    const updateButtons = () =>
      dialog.dialog(
        'option',
        'buttons',
        finalSelectedCells.length > 1
          ? [
              {
                text: 'Previous',
                click: () => changeSelectedCell(currentCellIndex - 1),
                disabled: currentCellIndex === 0,
              },
              {
                text: 'Next',
                click: () => changeSelectedCell(currentCellIndex + 1),
                disabled: finalSelectedCells.length <= currentCellIndex + 1,
              },
            ]
          : []
      );
    updateButtons();

    const handleGeolocateResult = (event) => {
      const dataColumns = event.data.split('|');
      if (dataColumns.length !== 4 || event.data === '|||') return;

      that.wbview.hot.setDataAtCell(
        ['latitude1', 'longitude1', 'latlongaccuracy']
          .map((column, index) => {
            if (typeof currentLocalityColumns[column] !== 'undefined')
              return [
                finalSelectedCells[currentCellIndex][0],
                currentLocalityColumns[column],
                dataColumns[index],
              ];
          })
          .filter((record) => typeof record !== 'undefined')
      );

      if (finalSelectedCells.length === 1) {
        dialog.dialog('close');
        handleAfterDialogClose();
      }
    };

    window.addEventListener('message', handleGeolocateResult, false);
  },
  showLeafletMap() {
    if ($('#leaflet-map').length !== 0) return;

    const localityPoints = WbLocalityDataExtractor.getLocalitiesDataFromSpreadsheet(
      this.localityColumns,
      this.wbview.dataset.rows,
      this.wbview.dataset.columns
    );

    Leaflet.showLeafletMap({
      localityPoints,
      markerClickCallback: (localityPoint) => {
        const rowNumber = localityPoints[localityPoint].rowNumber.value;
        const selectedColumn =
          typeof this.wbview.hot.getSelectedLast() === 'undefined'
            ? 0
            : this.wbview.hot.getSelectedLast()[1];
        // select the first cell to scroll the view
        this.wbview.hot.selectCell(rowNumber, selectedColumn);
        this.wbview.hot.selectRows(rowNumber); // select an entire row
      },
    });
  },
  showCoordinateConversion() {
    if ($('.lat-long-format-options').length !== 0) return;

    const columnHandlers = {
      'locality.latitude1': 'Lat',
      'locality.longitude1': 'Long',
      'locality.latitude2': 'Lat',
      'locality.longitude2': 'Long',
    };

    const columnsToSearchFor = Object.keys(columnHandlers);

    const coordinateColumns = this.localityColumns.reduce(
      (coordinateColumns, columnIndexes) => [
        ...coordinateColumns,
        ...Object.entries(columnIndexes).filter(
          ([columnName]) => columnsToSearchFor.indexOf(columnName) !== -1
        ),
      ],
      []
    );

    if (coordinateColumns.length === 0) return;

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

    const closeDialog = () => {
      dialog.off('change', handleOptionChange);
      dialog.remove();
    };

    const dialogButtons = [
      {
        text: 'Undo',
        click: this.wbview.hot.undo,
        disabled: true,
        class: 'undo-button',
      },
      { text: 'Close', click: closeDialog },
    ];

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
      title: 'Change Geocoordinate Formats',
      close: closeDialog,
      width: 350,
      buttons: dialogButtons,
    });

    const handleOptionChange = () => {
      if (dialogButtons[0].disabled) {
        dialogButtons[0].disabled = false;
        dialog.dialog('option', 'buttons', dialogButtons);
      }

      const includeSymbolsCheckbox = dialog.find(
        'input[name="includesymbols"]'
      );
      const includeSymbols = includeSymbolsCheckbox.is(':checked');

      const selectedOption = dialog.find('input[type="radio"]:checked');
      if (selectedOption.length === 0) return;

      const optionValue = selectedOption.attr('value');
      if (typeof options[optionValue] === 'undefined') return;

      const { conversionFunctionName, showCardinalDirection } = options[
        optionValue
      ];
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
        coordinateColumns
          .map(([columnName, columnIndex]) =>
            this.wbview.hot
              .getDataAtCol(columnIndex)
              .map((cellValue, rowIndex) => [
                latlongutils[columnHandlers[columnName]].parse(cellValue),
                rowIndex,
              ])
              .filter(([coordinate]) => coordinate !== null)
              .map(([coordinate, rowIndex]) => [
                rowIndex,
                columnIndex,
                includeSymbolsFunction(
                  stripCardinalDirections(
                    coordinate[conversionFunctionName]().format()
                  )
                ).trim(),
              ])
          )
          .flat()
      );
    };
    dialog.on('change', handleOptionChange);
  },
});
