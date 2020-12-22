const $ = require('jquery');
const Leaflet = require('./leaflet.js');
const Backbone = require('./backbone.js');
const latlongutils = require('./latlongutils.js');

module.exports = Backbone.View.extend({
  __name__: 'WbUtils',
  className: 'wbs-utils',
  events: {
    'click .wb-cell-navigation': 'navigateCells',
    'click .wb-search-button': 'searchCells',
    'click .wb-replace-button': 'replaceCells',
    'click .wb-show-toolbelt': 'toggleToolbelt',
  },
  initialize({wbview, wb, hot, colHeaders}) {
    this.wbview = wbview;
    this.cellInfo = [];
    this.searchQuery = null;
    this.hot = hot;
    this.cellInfo = [];
    this.wb = wb;
    this.localityColumns = [];
    this.colHeaders = colHeaders;
  },
  render() {
    return this;
  },
  initCellInfo(row, col) {
    const cols = this.wbview.hot.countCols();
    if (typeof this.cellInfo[row * cols + col] === 'undefined') {
      this.cellInfo[row * cols + col] = {
        isNew: false,
        issues: [],
        matchesSearch: false,
      };
    }
  },
  navigateCells(e, matchCurrentCell = false) {
    const button = e.target;
    const direction = button.getAttribute('data-navigation-direction');
    const buttonParent = button.parentElement;
    const type = buttonParent.getAttribute('data-navigation-type');

    const numberOfColumns = this.wbview.hot.countCols();

    const selectedCell = this.wbview.hot.getSelectedLast();

    let currentPosition = 0;
    if (typeof selectedCell !== 'undefined') {
      const [row, col] = selectedCell;
      currentPosition = row * numberOfColumns + col;
    }

    const cellIsType = (info) => {
      switch (type) {
        case 'invalid-cells':
          return info.issues.length > 0;
        case 'new-cells':
          return info.isNew;
        case 'search-results':
          return info.matchesSearch;
        default:
          return false;
      }
    };

    let newPosition = currentPosition;
    let found = false;
    for (;
      newPosition >= 0 && newPosition < this.cellInfo.length;
      newPosition += direction === 'next' ? 1 : -1
    ) {
      if (newPosition === currentPosition && !matchCurrentCell)
        continue;

      const info = this.cellInfo[newPosition];
      if (typeof info === 'undefined') continue;
      found = cellIsType(info);
      if (found) break;
    }

    if (found) {
      const row = Math.floor(newPosition / numberOfColumns);
      const col = newPosition - row * numberOfColumns;
      this.wbview.hot.selectCell(row, col, row, col);

      const cellRelativePosition = this.cellInfo.reduce((count, info, i) =>
        count + (
          cellIsType(info) && i <= newPosition ? 1 : 0
        ),
        0
      );
      const currentPositionElement =
        buttonParent.getElementsByClassName('wb-navigation-position')[0];
      currentPositionElement.innerText = cellRelativePosition;
    }
  },
  searchCells(e) {
    const cols = this.wbview.hot.countCols();
    const button = e.target;
    const container = button.parentElement;
    const navigationPositionElement =
      container.getElementsByClassName('wb-navigation-position')[0];
    const navigationTotalElement =
      container.getElementsByClassName('wb-navigation-total')[0];
    const searchQueryElement =
      container.getElementsByClassName('wb-searchQuery')[0];
    const navigationButton =
      container.getElementsByClassName('wb-cell-navigation');
    const searchQuery = searchQueryElement.value;

    const searchPlugin = this.wbview.hot.getPlugin('search');
    const results = searchPlugin.query(searchQuery);
    this.searchQuery = searchQuery;

    this.cellInfo.forEach(cellInfo => {
      cellInfo.matchesSearch = false;
    });
    results.forEach(({row, col}) => {
      this.initCellInfo(row, col);
      this.cellInfo[row * cols + col].matchesSearch = true;
    });
    this.wbview.hot.render();

    navigationTotalElement.innerText = results.length;
    navigationPositionElement.innerText = 0;

    if (!this.navigateCells({target: navigationButton[0]}, true))
      this.navigateCells({target: navigationButton[1]}, true);

  },
  replaceCells(e) {
    const cols = this.wbview.hot.countCols();
    const button = e.target;
    const container = button.parentElement;
    const replacementValueElement =
      container.getElementsByClassName('wb-replace-value')[0];
    const replacementValue = replacementValueElement.value;

    const cellUpdates = [];
    this.cellInfo.forEach((info, i) => {
      if (info.matchesSearch) {
        const row = Math.floor(i / cols);
        const col = i - row * cols;
        const cellValue = this.wbview.hot.getDataAtCell(row, col);
        cellUpdates.push([
          row,
          col,
          cellValue.split(this.searchQuery).join(replacementValue)
        ]);
      }
    });

    this.wbview.hot.setDataAtCell(cellUpdates);
  },
  toggleToolbelt(e) {
    const button = e.target;
    const container = button.closest('.wb-header');
    const toolbelt = container.getElementsByClassName('wb-toolbelt')[0];
    if (toolbelt.style.display === 'none')
      toolbelt.style.display = '';
    else
      toolbelt.style.display = 'none';
  },
  fillCells({startRow, endRow, col, value}) {
    this.wbview.hot.setDataAtCell(
      [...Array(endRow - startRow).keys()].map(index =>
        [
          startRow + index + 1,
          col,
          value,
        ],
      ),
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
  /*fillDownWithIncrement({startRow, endRow, col}){
    const firstCell = this.wbview.hot.getDataAtCell(startRow, col);
    if (isNaN(firstCell))
      return;
    const numericPart = parseInt(firstCell);
    const changes = [];
    const numberOfRows = endRow - startRow;
    for (let i = 0; i <= numberOfRows; i++)
      changes.push([
        startRow + i,
        col,
        (numericPart + i).toString().padStart(firstCell.length, '0')
      ]);
    this.wbview.hot.setDataAtCell(changes);
  },*/
  fillCellsContextMenuItem(name, handlerFunction) {
    return {
      name: name,
      disabled: () =>
        this.wbview.hot.getSelected()?.every(selection =>
          selection[0] === selection[2],
        ) ?? false,
      callback: (_, selections) =>
        selections.forEach(selection =>
          [...Array(
            selection.end.col + 1 - selection.start.col
          ).keys()].forEach(index =>
            handlerFunction.bind(this)({
              startRow: selection.start.row,
              endRow: selection.end.row,
              col: selection.start.col + index,
            }),
          ),
        ) || this.wbview.hot.deselectCell(),
    };
  },
  findLocalityColumns() {
    this.wb.rget('workbenchtemplate').done(wbtemplate => {

      const uploadPlanString = wbtemplate.get('remarks');
      const localityColumns =
        this.wbutils.findLocalityColumns(uploadPlanString);

      this.localityColumns = localityColumns.map(localityMapping =>
        Object.fromEntries(
          Object.entries(localityMapping).map(([columnName, headerName]) =>
            [columnName, this.colHeaders.indexOf(headerName)],
          ),
        ),
      );

      if (this.localityColumns.length === 0)
        [
          'wb-geolocate',
          'wb-leafletmap',
          'wb-convert-coordinates'
        ].map(className => (
          document.getElementsByClassName(className)[0].disabled = true
        ));
    });
  },
  getGeoLocateQueryURL(
    currentLocalityColumns,
    selectedRow,
    getDataAtCell,
    getDataAtRow
  ) {

    if (currentLocalityColumns === false)
      return;

    let queryString;

    if (
      typeof currentLocalityColumns.country !== 'undefined' &&
      typeof currentLocalityColumns.state !== 'undefined'
    ) {

      const data = Object.fromEntries([
        'country',
        'state',
        'county',
        'localityname'
      ].map(columnName =>
        [
          columnName,
          typeof currentLocalityColumns[columnName] === 'undefined' ?
            undefined :
            encodeURIComponent(
              getDataAtCell(
                selectedRow,
                currentLocalityColumns[columnName]
              )
            ),
        ],
      ));

      queryString = `country=${data.country}&state=${data.state}`;

      if (typeof data.county !== 'undefined')
        queryString += `&county=${data.county}`;

      if (typeof data.localityname !== 'undefined')
        queryString += `&locality=${data.localityname}`;

    }
    else {

      const pointDataDict = Leaflet.getLocalityCoordinate(
        getDataAtRow(selectedRow),
        currentLocalityColumns
      );

      if (!pointDataDict)
        return;

      const {latitude1, longitude1, localityname = ''} = pointDataDict;

      const pointDataList = [latitude1, longitude1];

      if (localityname !== '')
        pointDataList.push(localityname);

      queryString = `points=${pointDataList.join('|')}`;

    }

    return (
      `https://www.geo-locate.org/web/WebGeoreflight.aspx?v=1&w=900&h=400&${
        queryString
      }`
    );

  },
  showGeoLocate() {

    // don't allow opening more than one window)
    if ($('#geolocate-window').length !== 0)
      return;

    let $this = this;

    const selectedRegions = this.hot.getSelected() || [[0, 0, 0, 0]];
    const selections = selectedRegions.map(([startRow, column, endRow]) =>
      startRow < endRow ?
        [startRow, endRow, column] :
        [endRow, startRow, column],
    );
    const selectedCells = selections.flatMap(([startRow, endRow, column]) =>
      [...Array(endRow - startRow + 1)].map((_, index) =>
        [startRow + index, column].join('_'),
      ),
    );
    const uniqueSelectedCells = [...new Set(selectedCells)];
    const finalSelectedCells = uniqueSelectedCells.map((selectedCell) =>
      selectedCell.split('_').map(index => parseInt(index)),
    );

    if (finalSelectedCells.length === 0)
      return;

    let currentCellIndex = 0;
    let geolocateQueryUrl = false;
    let currentLocalityColumns = [];

    function updateGeolocateUrl() {

      currentLocalityColumns =
        Leaflet.getLocalityColumnsFromSelectedCell(
          $this.localityColumns,
          finalSelectedCells[currentCellIndex][1],
        );

      geolocateQueryUrl = $this.getGeoLocateQueryURL(
        currentLocalityColumns,
        finalSelectedCells[currentCellIndex][0],
        $this.hot.getDataAtCell,
        $this.hot.getDataAtRow,
      );

    }

    updateGeolocateUrl();

    if (geolocateQueryUrl === false)
      return;

    const handleAfterDialogClose = () =>
      window.removeEventListener('message', handleGeolocateResult, false);

    const dialog = $(`<div />`, {id: 'geolocate-window'}).dialog({
      width: 960,
      height: finalSelectedCells.length === 1 ?
        680 :
        740,
      title: 'GEOLocate',
      close: function() {
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
      $this.hot.selectRows(finalSelectedCells[currentCellIndex][0]);
    updateSelectedRow();

    function changeSelectedCell(newSelectedCell) {

      currentCellIndex = newSelectedCell;

      updateGeolocateUrl();

      if (geolocateQueryUrl === false)
        return;

      updateGeolocate();

      updateSelectedRow();

      updateButtons();
    }

    const updateButtons = () =>
      dialog.dialog(
        'option',
        'buttons',
        finalSelectedCells.length > 1 ?
          [
            {
              text: 'Previous',
              click: () =>
                changeSelectedCell(currentCellIndex - 1),
              disabled: currentCellIndex === 0,
            },
            {
              text: 'Next',
              click: () =>
                changeSelectedCell(currentCellIndex + 1),
              disabled:
                finalSelectedCells.length <=
                currentCellIndex + 1,
            },
          ] :
          [],
      );
    updateButtons();

    const handleGeolocateResult = (event) => {

      const dataColumns = event.data.split('|');
      if (dataColumns.length !== 4 || event.data === '|||')
        return;

      $this.hot.setDataAtCell(
        Object.entries(
          ['latitude1', 'longitude1', 'latlongaccuracy'],
        ).map(([index, column]) => {
          if (typeof currentLocalityColumns[column] !== 'undefined')
            return [
              finalSelectedCells[currentCellIndex][0],
              currentLocalityColumns[column],
              dataColumns[index],
            ];
        }).filter(record => typeof record !== 'undefined'),
      );

      if (finalSelectedCells.length === 1) {
        dialog.dialog('close');
        handleAfterDialogClose();
      }
    };

    window.addEventListener('message', handleGeolocateResult, false);

  },
  showLeafletMap() {

    if ($('#leaflet-map').length !== 0)
      return;

    Leaflet.showLeafletMap({
      localityPoints,
      markerClickCallback: (localityPoint) => {
        const rowNumber = localityPoints[localityPoint].rowNumber;
        const selectedColumn =
          typeof this.hot.getSelectedLast() === 'undefined' ?
            0 :
            this.hot.getSelectedLast()[1];
        // select the first cell to scroll the view
        this.hot.selectCell(rowNumber, selectedColumn);
        this.hot.selectRows(rowNumber);  // select an entire row
      },
    });

  },
  showCoordinateConversion() {

    if ($('.latlongformatoptions').length !== 0)
      return;

    const columnHandlers = {
      'latitude1': 'Lat',
      'longitude1': 'Long',
      'latitude2': 'Lat',
      'longitude2': 'Long',
    };

    const columnsToSearchFor = Object.keys(columnHandlers);

    const coordinateColumns = this.localityColumns.reduce((
      coordinateColumns,
      columnIndexes
      ) =>
        [
          ...coordinateColumns,
          ...Object.entries(columnIndexes).filter(([columnName]) =>
            columnsToSearchFor.indexOf(columnName) !== -1,
          ),
        ],
      [],
    );

    if (coordinateColumns.length === 0)
      return;

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

    const dialog = $(
      `<ul class="latlongformatoptions">
        ${Object.values(options).map(({optionName}, optionIndex) =>
        `<li>
            <label>
              <input
                type="radio"
                name="latlongformat"
                value="${optionIndex}"
              >
              ${optionName}
            </label>
          </li>`,
      ).join('')}
        <li>
          <br>
          <label>
            <input type="checkbox" name="includesymbols">
            Include Symbols
          </label>
        </li>
      </ul>`,
    ).dialog({
      title: 'Coordinate format converter',
      close: closeDialog,
      buttons: [
        {text: 'Close', click: closeDialog},
      ],
    });

    const handleOptionChange = () => {

      const includeSymbolsCheckbox = dialog.find(
        'input[name="includesymbols"]'
      );
      const includeSymbols = includeSymbolsCheckbox.is(':checked');

      const selectedOption = dialog.find('input[type="radio"]:checked');
      if (selectedOption.length === 0)
        return;

      const optionValue = selectedOption.attr('value');
      if (typeof options[optionValue] === 'undefined')
        return;

      const {
        conversionFunctionName,
        showCardinalDirection,
      } = options[optionValue];
      const includeSymbolsFunction = includeSymbols ?
        coordinate => coordinate :
        coordinate => coordinate.replace(/[^\w\s\-.]/gm, '');
      const lastChar = value => value[value.length - 1];
      const removeLastChar = value => value.slice(0, -1);
      const endsWith = (value, charset) =>
        charset.indexOf(lastChar(value)) !== -1;
      const stripCardinalDirections = finalValue =>
        showCardinalDirection ?
          finalValue :
          endsWith(finalValue, 'SW') ?
            '-' + removeLastChar(finalValue) :
            endsWith(finalValue, 'NE') ?
              removeLastChar(finalValue) :
              finalValue;

      this.hot.setDataAtCell(
        coordinateColumns.map(([columnName, columnIndex]) =>
          this.hot.getDataAtCol(columnIndex).map((cellValue, rowIndex) =>
            [
              latlongutils[columnHandlers[columnName]].parse(cellValue),
              rowIndex
            ],
          ).filter(([coordinate]) =>
            coordinate !== null,
          ).map(([coordinate, rowIndex]) =>
            [
              rowIndex,
              columnIndex,
              includeSymbolsFunction(
                stripCardinalDirections(
                  coordinate[conversionFunctionName]().format(),
                ),
              ).trim(),
            ],
          ),
        ).flat(),
      );

    };
    dialog.on('change', handleOptionChange);
  },
});