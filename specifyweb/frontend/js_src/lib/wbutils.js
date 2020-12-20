const $ = require('jquery');
const Leaflet = require('./leaflet.js');
const wb_upload_helper = require('./wb_upload/external_helper.ts');
const Backbone = require('./backbone.js');
const latlongutils = require('./latlongutils.js');

module.exports = Backbone.View.extend({
  __name__: 'WbUtils',
  className: 'wbs-utils',
  events: {
    'click .wb-cell_navigation': 'navigateCells',
    'click .wb-search-button': 'searchCells',
    'click .wb-replace-button': 'replaceCells',
    'click .wb-show-toolbelt': 'toggleToolbelt',
  },
  initialize({wbview, wb, hot, colHeaders}) {
    this.wbview = wbview;
    this.cellInfo = [];
    this.search_query = null;
    this.hot = hot;
    this.cellInfo = [];
    this.search_query = null;
    this.wb = wb;
    this.locality_columns = [];
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
  navigateCells(e, match_current_cell = false) {
    const button = e.target;
    const direction = button.getAttribute('data-navigation_direction');
    const button_parent = button.parentElement;
    const type = button_parent.getAttribute('data-navigation_type');

    const number_of_columns = this.wbview.hot.countCols();

    const selected_cell = this.wbview.hot.getSelectedLast();

    let current_position = 0;
    if (typeof selected_cell !== 'undefined') {
      const [row, col] = selected_cell;
      current_position = row * number_of_columns + col;
    }

    const cellIsType = (info) => {
      switch (type) {
        case 'invalid_cells':
          return info.issues.length > 0;
        case 'new_cells':
          return info.isNew;
        case 'search_results':
          return info.matchesSearch;
        default:
          return false;
      }
    };

    let new_position = current_position;
    let found = false;
    for (;
      new_position >= 0 && new_position < this.cellInfo.length;
      new_position += direction === 'next' ? 1 : -1
    ) {
      if (new_position === current_position && !match_current_cell) continue;

      const info = this.cellInfo[new_position];
      if (typeof info === 'undefined') continue;
      found = cellIsType(info);
      if (found) break;
    }

    if (found) {
      const row = Math.floor(new_position / number_of_columns);
      const col = new_position - row * number_of_columns;
      this.wbview.hot.selectCell(row, col, row, col);

      const cell_relative_position = this.cellInfo.reduce((count, info, i) => count + (
        cellIsType(info) && i <= new_position ? 1 : 0
      ), 0);
      const current_position_element = button_parent.getElementsByClassName('wb-navigation_position')[0];
      current_position_element.innerText = cell_relative_position;
    }
  },
  searchCells(e) {
    const cols = this.wbview.hot.countCols();
    const button = e.target;
    const container = button.parentElement;
    const navigation_position_element = container.getElementsByClassName('wb-navigation_position')[0];
    const navigation_total_element = container.getElementsByClassName('wb-navigation_total')[0];
    const search_query_element = container.getElementsByClassName('wb-search_query')[0];
    const navigation_button = container.getElementsByClassName('wb-cell_navigation');
    const search_query = search_query_element.value;

    const searchPlugin = this.wbview.hot.getPlugin('search');
    const results = searchPlugin.query(search_query);
    this.search_query = search_query;

    this.cellInfo.forEach(cellInfo => {
      cellInfo.matchesSearch = false;
    });
    results.forEach(({row, col}) => {
      this.initCellInfo(row, col);
      this.cellInfo[row * cols + col].matchesSearch = true;
    });
    this.wbview.hot.render();

    navigation_total_element.innerText = results.length;
    navigation_position_element.innerText = 0;

    if (!this.navigateCells({target: navigation_button[0]}, true))
      this.navigateCells({target: navigation_button[1]}, true);

  },
  replaceCells(e) {
    const cols = this.wbview.hot.countCols();
    const button = e.target;
    const container = button.parentElement;
    const replacement_value_element = container.getElementsByClassName('wb-replace_value')[0];
    const replacement_value = replacement_value_element.value;

    const cellUpdates = [];
    this.cellInfo.forEach((info, i) => {
      if (info.matchesSearch) {
        const row = Math.floor(i / cols);
        const col = i - row * cols;
        const cellValue = this.wbview.hot.getDataAtCell(row, col);
        cellUpdates.push([row, col, cellValue.split(this.search_query).join(replacement_value)]);
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
  fillCells({start_row, end_row, col, value}) {
    this.wbview.hot.setDataAtCell(
      [...Array(end_row - start_row).keys()].map(index =>
        [
          start_row + index + 1,
          col,
          value,
        ],
      ),
    );
  },
  fillDown(props) {
    this.fillCells({
      ...props,
      value: this.wbview.hot.getDataAtCell(props.start_row, props.col),
    });
  },
  fillUp(props) {
    this.fillCells({
      ...props,
      start_row: props.start_row - 1,
      value: this.wbview.hot.getDataAtCell(props.end_row, props.col),
    });
  },
  /*fillDownWithIncrement({start_row, end_row, col}){
    const first_cell = this.wbview.hot.getDataAtCell(start_row, col);
    if (isNaN(first_cell))
      return;
    const numeric_part = parseInt(first_cell);
    const changes = [];
    const number_of_rows = end_row - start_row;
    for (let i = 0; i <= number_of_rows; i++)
      changes.push([
        start_row + i,
        col,
        (numeric_part + i).toString().padStart(first_cell.length, '0')
      ]);
    this.wbview.hot.setDataAtCell(changes);
  },*/
  fillCellsContextMenuItem(name, handler_function) {
    return {
      name: name,
      disabled: () =>
        this.wbview.hot.getSelected()?.every(selection =>
          selection[0] === selection[2],
        ) ?? false,
      callback: (_, selections) =>
        selections.forEach(selection =>
          [...Array(selection.end.col + 1 - selection.start.col).keys()].forEach(index =>
            handler_function.bind(this)({
              start_row: selection.start.row,
              end_row: selection.end.row,
              col: selection.start.col + index,
            }),
          ),
        ) || this.wbview.hot.deselectCell(),
    };
  },
  findLocalityColumns() {
    this.wb.rget('workbenchtemplate').done(wbtemplate => {

      const upload_plan_string = wbtemplate.get('remarks');
      const locality_columns = wb_upload_helper.find_locality_columns(upload_plan_string);

      this.locality_columns = locality_columns.map(locality_mapping =>
        Object.fromEntries(
          Object.entries(locality_mapping).map(([column_name, header_name]) =>
            [column_name, this.colHeaders.indexOf(header_name)],
          ),
        ),
      );

      if (this.locality_columns.length === 0)
        ['wb-geolocate', 'wb-leafletmap', 'wb-convert-coordinates'].map(class_name =>
          document.getElementsByClassName(class_name)[0].disabled = true,
        );
    });
  },
  getGeoLocateQueryURL(current_locality_columns, selected_row, getDataAtCell, getDataAtRow) {

    if (current_locality_columns === false)
      return;

    let query_string;

    if (
      typeof current_locality_columns.country !== 'undefined' &&
      typeof current_locality_columns.state !== 'undefined'
    ) {

      const data = Object.fromEntries(['country', 'state', 'county', 'localityname'].map(column_name =>
        [
          column_name,
          typeof current_locality_columns[column_name] === 'undefined' ?
            undefined :
            encodeURIComponent(getDataAtCell(selected_row, current_locality_columns[column_name])),
        ],
      ));

      query_string = `country=${data.country}&state=${data.state}`;

      if (typeof data.county !== 'undefined')
        query_string += `&county=${data.county}`;

      if (typeof data.localityname !== 'undefined')
        query_string += `&locality=${data.localityname}`;

    }
    else {

      const point_data_dict = Leaflet.getLocalityCoordinate(getDataAtRow(selected_row), current_locality_columns);

      if (!point_data_dict)
        return;

      const {latitude1, longitude1, localityname = ''} = point_data_dict;

      const point_data_list = [latitude1, longitude1];

      if (localityname !== '')
        point_data_list.push(localityname);

      query_string = `points=${point_data_list.join('|')}`;

    }

    return `https://www.geo-locate.org/web/WebGeoreflight.aspx?v=1&w=900&h=400&${query_string}`;

  },
  showGeoLocate() {

    // don't allow to open more than one window)
    if ($('#geolocate_window').length !== 0)
      return;

    const selected_cell = this.hot.getSelectedLast() || [0, 0];
    const [selected_row, selected_column] = selected_cell;

    const current_locality_columns = Leaflet.getLocalityColumnsFromSelectedCell(this.locality_columns, selected_column);
    const geolocate_query_url = this.getGeoLocateQueryURL(current_locality_columns, selected_row, this.hot.getDataAtCell, this.hot.getDataAtRow);

    if (geolocate_query_url === false)
      return;

    const dialog = $(`
            <div id="geolocate_window">
                <iframe
                    style="
                        width: 100%;
                        height: 100%;
                        border: none;"
                    src="${geolocate_query_url}"></iframe>
            </div>`,
    ).dialog({
      width: 980,
      height: 700,
      resizable: false,
      title: 'GEOLocate',
      close: function() {
        $(this).remove();
      },
    });

    const handle_geolocate_result = (event) => {

      const data_columns = event.data.split('|');
      if (data_columns.length !== 4 || event.data === '|||')
        return;

      this.hot.setDataAtCell(
        Object.entries(
          ['latitude1', 'longitude1', 'latlongaccuracy'],
        ).map(([index, column]) => {
          if (typeof current_locality_columns[column] !== 'undefined')
            return [selected_row, current_locality_columns[column], data_columns[index]];
        }).filter(record => typeof record !== 'undefined'),
      );

      dialog.dialog('close');
      window.removeEventListener('message', handle_geolocate_result, false);
    };

    window.addEventListener('message', handle_geolocate_result, false);

  },
  showLeafletMap() {

    if ($('#leaflet_map').length !== 0)
      return;

    Leaflet.showLeafletMap({
      locality_points: Leaflet.getLocalitiesDataFromSpreadsheet(
        this.locality_columns,
        this.hot.getData(),
      ),
      marker_click_callback: (row_number) => {
        const selected_column =
          typeof this.hot.getSelectedLast() === 'undefined' ?
            0 :
            this.hot.getSelectedLast()[1];
        this.hot.selectCell(row_number, selected_column);  // select the first cell to scroll the view
        this.hot.selectRows(row_number);  // select an entire row
      },
    });

  },
  showCoordinateConversion() {

    if ($('.latlongformatoptions').length !== 0)
      return;

    const column_handlers = {
      'latitude1': 'Lat',
      'longitude1': 'Long',
      'latitude2': 'Lat',
      'longitude2': 'Long',
    };

    const columns_to_search_for = Object.keys(column_handlers);

    const coordinate_columns = this.locality_columns.reduce((coordinate_columns, column_indexes) =>
        [
          ...coordinate_columns,
          ...Object.entries(column_indexes).filter(([column_name]) =>
            columns_to_search_for.indexOf(column_name) !== -1,
          ),
        ],
      [],
    );

    if (coordinate_columns.length === 0)
      return;

    const options = [
      {
        option_name: 'DD.DDDD (32.7619)',
        conversion_function_name: 'toDegs',
        show_cardinal_direction: false,
      },
      {
        option_name: 'DD MMMM (32. 45.714)',
        conversion_function_name: 'toDegsMins',
        show_cardinal_direction: false,
      },
      {
        option_name: 'DD MM SS.SS (32 45 42.84)',
        conversion_function_name: 'toDegsMinsSecs',
        show_cardinal_direction: false,
      },
      {
        option_name: 'DD.DDDD N/S/E/W (32.7619 N)',
        conversion_function_name: 'toDegs',
        show_cardinal_direction: true,
      },
      {
        option_name: 'DD MM.MM N/S/E/W (32 45.714 N)',
        conversion_function_name: 'toDegsMins',
        show_cardinal_direction: true,
      },
      {
        option_name: 'DD MM SS.SS N/S/E/W (32 45 42.84 N)',
        conversion_function_name: 'toDegsMinsSecs',
        show_cardinal_direction: true,
      },
    ];

    const close_dialog = () => {
      dialog.off('change', handle_option_change);
      dialog.remove();
    };

    const dialog = $(
      `<ul class="latlongformatoptions">
        ${Object.values(options).map(({option_name}, option_index) =>
        `<li>
            <label>
              <input type="radio" name="latlongformat" value="${option_index}">
              ${option_name}
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
      close: close_dialog,
      buttons: [
        {text: 'Close', click: close_dialog},
      ],
    });

    const handle_option_change = () => {

      const include_symbols_checkbox = dialog.find('input[name="includesymbols"]');
      const include_symbols = include_symbols_checkbox.is(':checked');

      const selected_option = dialog.find('input[type="radio"]:checked');
      if (selected_option.length === 0)
        return;

      const option_value = selected_option.attr('value');
      if (typeof options[option_value] === 'undefined')
        return;

      const {
        conversion_function_name,
        show_cardinal_direction,
      } = options[option_value];
      const include_symbols_function = include_symbols ?
        coordinate => coordinate :
        coordinate => coordinate.replace(/[^\w\s\-.]/gm, '');
      const last_char = value => value[value.length - 1];
      const remove_last_char = value => value.slice(0, -1);
      const ends_with = (value, charset) => charset.indexOf(last_char(value)) !== -1;
      const strip_cardinal_directions = final_value =>
        show_cardinal_direction ?
          final_value :
          ends_with(final_value, 'SW') ?
            '-' + remove_last_char(final_value) :
            ends_with(final_value, 'NE') ?
              remove_last_char(final_value) :
              final_value;

      this.hot.setDataAtCell(
        coordinate_columns.map(([column_name, column_index]) =>
          this.hot.getDataAtCol(column_index).map((cell_value, row_index) =>
            [latlongutils[column_handlers[column_name]].parse(cell_value), row_index],
          ).filter(([coordinate]) =>
            coordinate !== null,
          ).map(([coordinate, row_index]) =>
            [
              row_index,
              column_index,
              include_symbols_function(
                strip_cardinal_directions(
                  coordinate[conversion_function_name]().format(),
                ),
              ).trim(),
            ],
          ),
        ).flat(),
      );

    };
    dialog.on('change', handle_option_change);
  },
});
>>>>>>>
9;
f64e930;
...
Makes;
leaflet;
code;
reusable;
