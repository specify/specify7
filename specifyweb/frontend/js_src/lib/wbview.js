"use strict";
require ('../css/workbench.css');

const $        = require('jquery');
const _        = require('underscore');
const Backbone = require('./backbone.js');
const Q        = require('q');
const Handsontable = require('handsontable');
const Papa = require('papaparse');

const schema = require('./schema.js');
const app = require('./specifyapp.js');
const DataSetName = require('./dsname.js');
const navigation = require('./navigation.js');
const WBUploadedView = require('./components/wbuploadedview').default;
const WBStatus = require('./wbstatus.js');
const WBUtils = require('./wbutils.js');
const {uploadPlanToMappingsTree} = require('./wbplanviewconverter.ts');
const {mappingsTreeToArrayOfMappings} = require('./wbplanviewtreehelper.ts');
const {getMappingLineData} = require('./wbplanviewnavigator.ts');
const fetchDataModelPromise = require('./wbplanviewmodelfetcher.ts').default;
const icons = require('./icons.js');

const template = require('./templates/wbview.html');

const wb_upload_helper = require('./wb_upload/external_helper.ts');
const latlongutils = require('./latlongutils.js');

const L = require('leaflet');
require('leaflet/dist/leaflet.css');
/* This code is needed to properly load the images in the Leaflet CSS */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const WBView = Backbone.View.extend({
    __name__: "WbForm",
    className: "wbs-form",
    events: {
        'click .wb-upload': 'upload',
        'click .wb-validate': 'upload',
        'click .wb-plan': 'openPlan',
        'click .wb-show-plan': 'showPlan',
        'click .wb-delete': 'delete',
        'click .wb-save': 'saveClicked',
        'click .wb-export': 'export',
        'click .wb-toggle-highlights': 'toggleHighlights',
        'click .wb-cell_navigation': 'navigateCells',
        'click .wb-search-button': 'searchCells',
        'click .wb-replace-button': 'replaceCells',
        'click .wb-show-toolbelt': 'toggleToolbelt',
        'click .wb-geolocate': 'showGeoLocate',
        'click .wb-show-upload-view':'displayUploadedView',
        'click .wb-unupload':'unupload',
        'click .wb-leafletmap': 'showLeafletMap',
    },
    initialize({dataset, showStatusDialog}) {
        this.dataset = dataset;
        this.mappedHeaders = [];
        this.data = dataset.rows;
        if (this.data.length < 1)
            this.data.push(Array(this.dataset.columns.length).fill(null));

        this.highlightsOn = false;
        this.rowValidationRequests = {};

        this.wbutils = new WBUtils({
            wbview: this,
            el: this.el
        });

        this.uploaded = this.dataset.uploadresult && this.dataset.uploadresult.success;
        this.uploadedView = undefined;
        this.showStatusDialog = showStatusDialog;
    },
    render() {
        this.$el.append(template({
            is_uploaded: this.uploaded
        }));

        new DataSetName({dataset: this.dataset, el: this.$('.wb-name')}).render();

        if (this.dataset.uploaderstatus) this.openStatus();

        if (!this.dataset.uploadplan)
            $('<div>No plan has been defined for this dataset. Create one now?</div>').dialog({
                title: "No Plan is defined",
                modal: true,
                buttons: {
                    'Create': this.openPlan.bind(this),
                    'Cancel': function() { $(this).dialog('close'); }
                }
            });

        //initialize Handsontable

        this.colHeaders = colHeaders;
        this.find_locality_columns();
        this.hot = new Handsontable(this.$('.wb-spreadsheet')[0], {
            height: this.calcHeight(),
            data: this.data,
            cells: this.defineCell.bind(this, this.dataset.columns.length),
            colHeaders: (col)=>
                `<div class="wb-header-${col}">
                    <span class="wb-header-icon"></span>
                    <span class="wb-header-name columnSorting">
                        ${this.dataset.columns[col]}
                    </span>
                </div>`,
            minSpareRows: 0,
            comments: true,
            rowHeaders: true,
            manualColumnResize: true,
            manualColumnMove: this.dataset.visualorder || true,
            outsideClickDeselects: false,
            columnSorting: true,
            sortIndicator: true,
            search: {
                searchResultClass: 'wb-search-match-cell',
            },
            contextMenu: {
                items: {
                    'row_above': 'row_above',
                    'row_below': 'row_below',
                    'remove_row': 'remove_row',
                    'separator_1': '---------',
                    'fill_down': this.wbutils.fillCellsContextMenuItem(
                        'Fill Down',
                        this.wbutils.fillDown
                    ),
                    'fill_up': this.wbutils.fillCellsContextMenuItem(
                        'Fill Up',
                        this.wbutils.fillUp
                    ),
                    /*'fill_down_with_increment': this.utils.fillUpDownContextMenuItem(
                        'Fill Down With Increment',
                        this.wbutils.fillDownWithIncrement
                    ),*/
                    'separator_2': '---------',
                    'undo': 'undo',
                    'redo': 'redo',
                }
            },
            stretchH: 'all',
            readOnly: this.uploaded,
            afterColumnMove: this.columnMoved.bind(this),
            afterCreateRow: this.rowCreated.bind(this),
            afterRemoveRow: this.rowRemoved.bind(this),
            afterSelection: (r, c) => this.currentPos = [r,c],
            afterChange: this.afterChange.bind(this),
        });

        $(window).resize(this.resize.bind(this));

        this.getValidationResults();

        fetchDataModelPromise().then(this.identifyMappedHeaders.bind(this));

        return this;
    },
    afterChange(changes, source) {
        if (source !== 'edit') return;
        this.spreadSheetChanged();
        this.startValidation(changes);
    },
    rowCreated(index, amount) {
        const cols = this.hot.countCols();
        this.wbutils.cellInfo = this.wbutils.cellInfo.slice(0, index*cols).concat(new Array(amount*cols), this.wbutils.cellInfo.slice(index*cols));
        this.hot.render();
        this.spreadSheetChanged();
    },
    rowRemoved(index, amount) {
        const cols = this.hot.countCols();
        this.wbutils.cellInfo = this.wbutils.cellInfo.slice(0, index*cols).concat(this.wbutils.cellInfo.slice((index+amount)*cols));
        this.hot.render();
        if (this.hot.countRows() === 0) {
            this.hot.alter('insert_row', 0);
        }
        this.spreadSheetChanged();
    },
    columnMoved(columns, target) {
        const columnOrder = [];
        for (let i = 0; i < this.hot.countCols(); i++) {
            columnOrder.push(this.hot.toPhysicalColumn(i));
        }
        if (columnOrder.some((i,j) => i !== this.dataset.visualorder[j])) {
            this.dataset.visualorder = columnOrder;
            $.ajax(`/api/workbench/dataset/${this.dataset.id}/`, {
                type: "PUT",
                data: JSON.stringify({visualorder: columnOrder}),
                dataType: "json",
                processData: false
            });
        }
    },
    getValidationResults() {
        Q($.get(`/api/workbench/validation_results/${this.dataset.id}/`))
            .done(results => this.parseResults(results));
    },
    identifyMappedHeaders(){

        const stylesContainer = document.createElement('style');
        const unmappedHeaderStyles = '{ color: #999; }';
        const unmappedCellStyles = '{ color: #999; }';

        if (this.dataset.uploadplan) {
            const {
                baseTableName,
                mappingsTree: mappingsTree
            } = uploadPlanToMappingsTree(
                this.dataset.columns,
                this.dataset.uploadplan
            );
            const arrayOfMappings = mappingsTreeToArrayOfMappings(
                mappingsTree
            );
            const mappedHeadersAndTables = Object.fromEntries(
                arrayOfMappings.map(mappingsPath =>
                    [
                        mappingsPath.slice(-1)[0],
                        icons.getIcon(
                            getMappingLineData({
                                baseTableName: baseTableName,
                                mappingPath: mappingsPath.slice(0, -3),
                                iterate: false,
                                customSelectType: 'simple',
                                showHiddenFields: false,
                            })[0]?.tableName || '',
                        ),
                    ],
                ),
            );

            stylesContainer.innerHTML = `${
                this.dataset.columns.map((columnName, index)=>
                    `.wb-header-${index} ${
                        columnName in mappedHeadersAndTables ?
                            `.wb-header-icon {
                                display: inline !important;
                                background-image: url('${mappedHeadersAndTables[columnName]}')
                            }` :
                            `${unmappedHeaderStyles} .wb-col-${index} ${unmappedCellStyles}`
                    }`
                ).join('\n')
            }`;

            this.mappedHeaders = Object.keys(mappedHeadersAndTables);

        }
        else
            stylesContainer.innerText =
                `.handsontable th ${unmappedHeaderStyles} .handsontable td ${unmappedCellStyles}`;

        this.$el.append(stylesContainer);

    },
    parseResults(results) {
        if (results == null) {
            this.wbutils.cellInfo = [];
            this.hot.render();
            return;
        }

        this.wbutils.cellInfo = [];
        results.forEach((result, row) => {
            this.parseRowValidationResult(row, result);
        });

        this.updateCellInfos();
    },
    displayUploadedView(){

        if (!this.uploaded)
            return;

        const upload_view = this.$el.find('.wb-upload-view')[0];

        if (upload_view.children.length !== 0)
            return;

        upload_view.innerHTML = '<div></div>';
        const container = upload_view.children[0];

        this.uploadedView = new WBUploadedView({
            dataset: this.dataset,
            hot: this.hot,
            el: container,
            removeCallback: ()=>(this.uploadedView = undefined),
        }).render();
    },
    unupload(){
        if(typeof this.uploadedView !== "undefined") {
            this.uploadedView.remove();
            this.uploadedView = undefined;
        }
        $.post(`/api/workbench/unupload/${this.dataset.id}/`);
        this.openStatus('unupload');
    },
    updateCellInfos() {
        const cellCounts = {
            new_cells: this.wbutils.cellInfo.reduce((count, info) => count + (info.isNew ? 1 : 0), 0),
            invalid_cells: this.wbutils.cellInfo.reduce((count, info) => count + (info.issues.length ? 1 : 0), 0),
            search_results: this.wbutils.cellInfo.reduce((count, info) => count + (info.matchesSearch ? 1 : 0), 0),
        };

        //update navigation information
        Object.values(document.getElementsByClassName('wb-navigation_total')).forEach(navigation_total_element => {
            const navigation_type = navigation_total_element.parentElement.getAttribute('data-navigation_type');
            navigation_total_element.innerText = cellCounts[navigation_type];
        });

        // if(this.showStatusDialog){

        //     const upload_failed =
        //         cellCounts.invalid_cells !== 0 ||
        //         !this.dataset.uploadresult?.success;
        //     const upload_succeeded = !upload_failed && this.uploaded;

        //     const dialog = $(`<div>
        //         ${
        //             upload_failed ?
        //                 `Upload failed with ${cellCounts.invalid_cells} invalid cells.<br>
        //                 Please review the validation messages and repeat the upload process.` :
        //                 upload_succeeded ?
        //                     `Upload completed successfully.<br>
        //                     You can open the 'View' menu to see a detailed breakdown of the upload results.` :
        //                     'Unupload completed successfully'
        //         }
        //     </div>`).dialog({
        //         title: upload_failed ?
        //             'Upload failed due to validation errors' :
        //             upload_succeeded ?
        //                 'Upload completed' :
        //                 'Unupload completed' ,
        //         modal: true,
        //         buttons: {
        //             'Close': ()=>dialog.dialog('close'),
        //             ...(
        //                 upload_succeeded ?
        //                     {
        //                         'View upload results': ()=>
        //                             this.displayUploadedView() ||
        //                             dialog.dialog('close'),
        //                     } :
        //                     {}
        //             )
        //         }
        //     });
        //     this.showStatusDialog = false;
        // }

        this.hot.render();
    },
    parseRowValidationResult(row, result) {
        const cols = this.hot.countCols();
        const headerToCol = {};
        for (let i = 0; i < cols; i++) {
            headerToCol[this.dataset.columns[i]] = i;
        }

        for (let i = 0; i < cols; i++) {
            delete this.wbutils.cellInfo[row*cols + i];
        }

        const add_error_message = (column_name, issue) => {
            const col = headerToCol[column_name];
            this.wbutils.initCellInfo(row, col);
            const cellInfo = this.wbutils.cellInfo[row*cols + col];

            const ucfirst_issue = issue[0].toUpperCase() + issue.slice(1);
            cellInfo.issues.push(ucfirst_issue);
        };

        if(result === null)
            return;

        result.tableIssues.forEach(table_issue => table_issue.columns.forEach(column_name => {
            add_error_message(column_name, table_issue.issue);
        }));

        result.cellIssues.forEach(cell_issue => {
            add_error_message(cell_issue.column, cell_issue.issue);
        });

        result.newRows.forEach(({columns}) =>
            columns.forEach(column_name => {
                const col = headerToCol[column_name];
                this.wbutils.initCellInfo(row, col);
                const cellInfo = this.wbutils.cellInfo[row*cols + col];
                cellInfo.isNew = true;
            })
        );

    },
    defineCell(cols, row, col, prop) {
        let cell_data;
        try {
            cell_data = this.wbutils.cellInfo[row*cols + col];
        } catch (e) {
        }

        return {
            comment: cell_data && {value: cell_data.issues.join('<br>')},
            renderer: function(instance, td, row, col, prop, value, cellProperties) {
                if(cell_data && cell_data.isNew)
                    td.classList.add('wb-no-match-cell');

                if(cell_data && cell_data.issues.length)
                    td.classList.add('wb-invalid-cell');

                td.classList.add(`wb-col-${col}`);

                Handsontable.renderers.TextRenderer.apply(null, arguments);
            }
        };
    },
    openPlan() {
        navigation.go(`/workbench-plan/${this.dataset.id}/`);
    },
    showPlan() {
        const dataset = this.dataset;
        const $this = this;
        const planJson = JSON.stringify(dataset.uploadplan, null, 4);
        $('<div>').append($('<textarea cols="120" rows="50">').text(planJson)).dialog({
            title: "Upload plan",
            width: 'auto',
            modal: true,
            close() { $(this).remove(); },
            buttons: {
                Save() {
                    dataset.uploadplan = JSON.parse($('textarea', this).val());
                    $.ajax(`/api/workbench/dataset/${dataset.id}/`, {
                        type: "PUT",
                        data: JSON.stringify({uploadplan: dataset.uploadplan}),
                        dataType: "json",
                        processData: false
                    });
                    $(this).dialog('close');
                    $this.trigger('refresh');
                } ,
                Close() { $(this).dialog('close'); }
            }
        });
    },
    spreadSheetChanged(change) {
        this.$('.wb-upload, .wb-validate').prop('disabled', true);
        this.$('.wb-upload, .wb-match').prop('disabled', true);
        this.$('.wb-save').prop('disabled', false);
        navigation.addUnloadProtect(this, "The workbench has not been saved.");
    },
    startValidation(changes) {
        if (
            this.dataset.uploadplan &&
            changes
        ) {
            changes.filter(([,column])=>  // ignore changes to unmapped columns
                this.mappedHeaders.indexOf(
                    this.dataset.columns[this.hot.toPhysicalColumn(column)]
                ) !== -1
            ).forEach(([row]) => {
                const rowData = this.hot.getDataAtRow(row);
                const data = Object.fromEntries(rowData.map((value, i) =>
                    [this.dataset.columns[this.hot.toPhysicalColumn(i)], value]
                ));
                const req = this.rowValidationRequests[row] = $.post(`/api/workbench/validate_row/${this.dataset.id}/`, data);
                req.done(result => this.gotRowValidationResult(row, req, result));
            });
        }
    },
    gotRowValidationResult(row, req, result) {
        if (req === this.rowValidationRequests[row]) {
            this.parseRowValidationResult(row, result);
            this.updateCellInfos();
        }
    },
    resize: function() {
        this.hot && this.hot.updateSettings({height: this.calcHeight()});
        return true;
    },
    calcHeight: function() {

        const offsetTop = this.$el.offset().top;

        if(offsetTop === 0)
            setTimeout(this.resize.bind(this), 20);

        return $(window).height() - offsetTop - 55;
    },
    saveClicked: function() {
        this.save().done();
    },
    save: function() {
        // clear validation
        this.wbutils.cellInfo = [];
        this.hot.render();

        //show saving progress bar
        var dialog = $('<div><div class="progress-bar"></div></div>').dialog({
            title: 'Saving',
            modal: true,
            open(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); },
            close() {$(this).remove();}
        });
        $('.progress-bar', dialog).progressbar({value: false});

        //send data
        return Q($.ajax(`/api/workbench/rows/${this.dataset.id}/`, {
            data: JSON.stringify(this.data),
            error: this.checkDeletedFail.bind(this),
            type: "PUT"
        })).then(() => {
            this.spreadSheetUpToDate();
        }).finally(() => dialog.dialog('close'));
    },
    checkDeletedFail(jqxhr) {
        if (jqxhr.status === 404) {
            this.$el.empty().append('Dataset was deleted by another session.');
            jqxhr.errorHandled = true;
        }
    },
    spreadSheetUpToDate: function() {
        this.$('.wb-upload, .wb-validate').prop('disabled', false);
        this.$('.wb-upload, .wb-match').prop('disabled', false);
        this.$('.wb-save').prop('disabled', true);
        navigation.removeUnloadProtect(this);
    },
    upload(evt) {
        const mode = $(evt.currentTarget).is('.wb-upload') ? "upload" : "validate";
        const openPlan = () => this.openPlan();
        if (!this.dataset.uploadplan) {
            $('<div>No plan has been defined for this dataset. Create one now?</div>').dialog({
                title: "No Plan is defined",
                modal: true,
                buttons: {
                    'Cancel': function() { $(this).dialog('close'); },
                    'Create': openPlan,
                }
            });
        } else {
            $.post(`/api/workbench/${mode}/${this.dataset.id}/`).fail(jqxhr => {
                this.checkDeletedFail(jqxhr);
            }).done(() => {
                this.openStatus(mode);
            });
        }
    },
    openStatus(mode) {
        new WBStatus({dataset: this.dataset}).render().on('done', () => {
            if (["upload", "unupload"].includes(mode)) {
                this.trigger('refresh');
            } else {
                this.getValidationResults();
            }
        });
    },
    showHighlights: function() {
        this.highlightsOn = true;
        this.hot.render();
    },
    removeHighlights: function() {
        this.highlightsOn = false;
        this.hot.render();
    },
    toggleHighlights: function() {
        if (this.highlightsOn) {
            this.removeHighlights();
            this.$('.wb-toggle-highlights').text('Show');
        } else {
            this.showHighlights();
            this.$('.wb-toggle-highlights').text('Hide');
        }
    },
    delete: function() {
        let dialog;
        const doDelete = () => {
            $.ajax(`/api/workbench/dataset/${this.dataset.id}/`, {type: "DELETE"}).done(() => {
                this.$el.empty().append('<p>Dataset deleted.</p>');
                dialog.dialog('close');
            }).fail(jqxhr => {
                this.checkDeletedFail(jqxhr);
                dialog.dialog('close');
            });
        };

        dialog = $('<div>Really delete?</div>').dialog({
            modal: true,
            title: "Confirm delete",
            close() { $(this).remove(); },
            buttons: {
                'Delete': doDelete,
                'Cancel': function() { $(this).dialog('close'); }
            }
        });
    },
    export() {
        const data = Papa.unparse({fields: this.dataset.columns, data: this.dataset.rows});
        const wbname = this.dataset.name;
        const filename = wbname.match(/\.csv$/) ? wbname : wbname + '.csv';
        const blob = new Blob([data], {type: 'text/csv;charset=utf-8;'});
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.setAttribute('download', filename);
        a.click();
    },
    navigateCells: function(e,match_current_cell=false){
        const button = e.target;
        const direction = button.getAttribute('data-navigation_direction');
        const button_parent = button.parentElement;
        const type = button_parent.getAttribute('data-navigation_type');

        const number_of_columns = this.hot.countCols();

        const selected_cell = this.hot.getSelectedLast();

        let current_position = 0;
        if(typeof selected_cell !== "undefined") {
            const [row, col] = selected_cell;
            current_position = row * number_of_columns + col;
        }

        const cellIsType = (info) => {
            switch(type) {
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
             new_position += direction === 'next' ? 1 : -1)
        {
            if (new_position === current_position && !match_current_cell) continue;

            const info = this.cellInfo[new_position];
            if (typeof info === "undefined") continue;
            found = cellIsType(info);
            if (found) break;
        }

        if (found) {
            const row = Math.floor(new_position / number_of_columns);
            const col = new_position - row * number_of_columns;
            this.hot.selectCell(row, col, row, col);

            const cell_relative_position = this.cellInfo.reduce((count, info, i) => count + (cellIsType(info) && i <= new_position ? 1 : 0), 0);
            const current_position_element = button_parent.getElementsByClassName('wb-navigation_position')[0];
            current_position_element.innerText = cell_relative_position;
        }
    },
    searchCells: function(e){
        const cols = this.hot.countCols();
        const button = e.target;
        const container = button.parentElement;
        const navigation_position_element = container.getElementsByClassName('wb-navigation_position')[0];
        const navigation_total_element = container.getElementsByClassName('wb-navigation_total')[0];
        const search_query_element = container.getElementsByClassName('wb-search_query')[0];
        const navigation_button = container.getElementsByClassName('wb-cell_navigation');
        const search_query = search_query_element.value;

        const searchPlugin = this.hot.getPlugin('search');
        const results = searchPlugin.query(search_query);
        this.search_query = search_query;

        this.cellInfo.forEach(cellInfo => {cellInfo.matchesSearch = false;});
        results.forEach(({row, col}) => {
            this.initCellInfo(row, col);
            this.cellInfo[row*cols + col].matchesSearch = true;
        });
        this.hot.render();

        navigation_total_element.innerText = results.length;
        navigation_position_element.innerText = 0;

        if(!this.navigateCells({target:navigation_button[0]},true))
            this.navigateCells({target:navigation_button[1]},true);

    },
    replaceCells: function(e){
        const cols = this.hot.countCols();
        const button = e.target;
        const container = button.parentElement;
        const replacement_value_element = container.getElementsByClassName('wb-replace_value')[0];
        const replacement_value = replacement_value_element.value;

        const cellUpdates = [];
        this.cellInfo.forEach((info, i) => {
            if (info.matchesSearch) {
                const row = Math.floor(i / cols);
                const col = i - row * cols;
                const cellValue = this.hot.getDataAtCell(row, col);
                cellUpdates.push([row, col, cellValue.split(this.search_query).join(replacement_value)]);
            }
        });

        this.hot.setDataAtCell(cellUpdates);
    },
    toggleToolbelt: function(e){
        const button = e.target;
        const container = button.closest('.wb-header');
        const toolbelt = container.getElementsByClassName('wb-toolbelt')[0];
        if(toolbelt.style.display === 'none')
            toolbelt.style.display = '';
        else
            toolbelt.style.display = 'none';
    },
    fillDownCells: function({start_row,end_row,col}){

        const first_cell = this.hot.getDataAtCell(start_row,col);

        if(isNaN(first_cell))
            return;

        const numeric_part = parseInt(first_cell);

        const changes = [];
        const number_of_rows = end_row - start_row;
        for(let i=0;i<=number_of_rows;i++)
            changes.push([
                start_row+i,
                col,
                (numeric_part+i).toString().padStart(first_cell.length,'0')
            ]);

        this.hot.setDataAtCell(changes);

    },
    find_locality_columns(){
        this.wb.rget('workbenchtemplate').done(wbtemplate => {

            const upload_plan_string = wbtemplate.get('remarks');
            const locality_columns = wb_upload_helper.find_locality_columns(upload_plan_string);

            this.locality_columns = locality_columns.map(locality_mapping =>
                Object.fromEntries(
                    Object.entries(locality_mapping).map(([column_name,header_name])=>
                        [column_name, this.colHeaders.indexOf(header_name)]
                    )
                )
            );

            if(this.locality_columns.length === 0) {
                document.getElementsByClassName('wb-geolocate')[0].disabled = true;
                document.getElementsByClassName('wb-leafletmap')[0].disabled = true;
            }
        });
    },
    getLocalityCoordinate: function(row, column_indexes, accept_polygons=false){

        const cell_is_valid = (column_name)=>
            typeof column_indexes[column_name] !== "undefined" &&
            column_indexes[column_name] !== -1 &&
            row[column_indexes[column_name]] !== null;

        const format_coordinate = (column_name)=>
            row[column_indexes[column_name]]===0 || row[column_indexes[column_name]] === '0' ?
                0:
                latlongutils.parse(row[column_indexes[column_name]]).toDegs()._components[0];

        if(
            !cell_is_valid('latitude1') ||
            !cell_is_valid('longitude1')
        )
            return false;

        const point_data = {};
        try {

            point_data['latitude1'] = format_coordinate('latitude1');
            point_data['longitude1'] = format_coordinate('longitude1');

            if(
                accept_polygons &&
                cell_is_valid('latitude2') &&
                cell_is_valid('longitude2') &&
                (
                    !cell_is_valid('latlongtype') ||
                    row[column_indexes['latlongtype']].toLowerCase() !== 'point'
                )
            ) {
                point_data['latitude2'] = format_coordinate('latitude2');
                point_data['longitude2'] = format_coordinate('longitude2');
                point_data['latlongtype'] = (
                    cell_is_valid('latlongtype') &&
                    row[column_indexes['latlongtype']].toLowerCase() === 'line'
                ) ? 'Line' : 'Rectangle';
            }
        }
        catch(e){
            return false;
        }

        if(cell_is_valid('localityname'))
            point_data['localityname'] = row[column_indexes['localityname']];

        if(cell_is_valid('latlongaccuracy'))
            point_data['latlongaccuracy'] = row[column_indexes['latlongaccuracy']];

        return point_data;

    },
    showGeoLocate: function(){

        if(this.locality_columns.length === 0)
            return;

        const selected_cell = this.hot.getSelectedLast();

        if(typeof selected_cell === "undefined")
            return;

        let [selected_row, selected_column] = selected_cell;
        let locality_columns;

        if(this.locality_columns.length > 1){
            // if there are multiple localities present in a row, check which group this field belongs too
            const locality_columns_to_search_for = ['localityname','latitude1','longitude1','latlongtype', 'latlongaccuracy'];
            if(!this.locality_columns.some(local_locality_columns=>
                Object.fromEntries(local_locality_columns).some((field_name,column_index)=>{
                    if(
                        locality_columns_to_search_for.indexOf(field_name) !== -1 &&
                        column_index === selected_column
                    )
                        return locality_columns = local_locality_columns;
                })
            ))
                return;  // if can not determine the group the column belongs too
        }
        else
            locality_columns = this.locality_columns[0];

        let query_string;

        if(
            typeof locality_columns['country'] !== "undefined" &&
            typeof locality_columns['state'] !== "undefined"
        ){

            const data = Object.fromEntries(['country','state','county','localityname'].map(column_name=>
                [
                    column_name,
                    typeof locality_columns[column_name] === "undefined" ?
                        undefined:
                        encodeURIComponent(this.hot.getDataAtCell(selected_row,locality_columns[column_name]))
                ]
            ));

            query_string = `country=${data['country']}&state=${data['state']}`;

            if(typeof data['county'] !== "undefined")
                query_string += `&county=${data['county']}`;

            if(typeof data['localityname'] !== "undefined")
                query_string += `&locality=${data['localityname']}`;

        }
        else {

            const point_data_dict = this.getLocalityCoordinate(this.hot.getDataAtRow(selected_row), locality_columns);

            if(!point_data_dict)
                return;

            const {latitude1, longitude1, localityname=''} = point_data_dict;

            const point_data_list = [latitude1, longitude1];

            if(localityname !== '')
                point_data_list.push(localityname);

            query_string = `points=${point_data_list.join('|')}`;

        }

        const dialog = $(`
            <div>
                <iframe
                    style="
                        width: 100%;
                        height: 100%;
                        border: none;"
                    src="https://www.geo-locate.org/web/WebGeoreflight.aspx?v=1&w=900&h=400&${query_string}"></iframe>
            </div>`
        ).dialog({
            width: 980,
            height: 700,
            resizable: false,
            title: "GEOLocate",
            close: function() { $(this).remove(); },
        });

        const handle_geolocate_result = (event)=>{

            const data_columns = event.data.split('|');
            if (data_columns.length !== 4)
                return;

            Object.entries(
                ['latitude1','longitude1','latlongaccuracy']
            ).map(([index,column])=>{
                if(typeof locality_columns[column] !== "undefined")
                    this.hot.setDataAtCell(selected_row,locality_columns[column],data_columns[index]);
            });

            dialog.dialog('close');
            window.removeEventListener("message", handle_geolocate_result, false);
        };

        window.addEventListener("message", handle_geolocate_result, false);
    },
    showLeafletMap: function(){

        $(`<div id="leaflet_map"></div>`
        ).dialog({
            width: 900,
            height: 600,
            title: "Leaflet map",
            close: function() { $(this).remove(); },
        });

        const locality_points = this.locality_columns.reduce((locality_points, column_indexes)=>{

            let i=0;
            for(const row of this.hot.getData()) {
                const locality_coordinate = this.getLocalityCoordinate(row,column_indexes,true);

                if(!locality_coordinate)
                    continue;

                locality_coordinate.row_number = i++;
                locality_points.push(locality_coordinate);
            }

            return locality_points;

        },[]);

        const map = L.map('leaflet_map');

        let defaultCenter = [0, 0];
        let defaultZoom = 1;
        if(locality_points.length>0){
            defaultCenter = [locality_points[0]['latitude1'],locality_points[0]['longitude1']];
            defaultZoom = 5;
        }
        const basemap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
        });

        map.setView(defaultCenter, defaultZoom);
        basemap.addTo(map);

        let index = 1;

        const create_a_point = (latitude1,longitude1) =>
            L.marker([latitude1,longitude1]);

        locality_points.map(point_data_dict=>{

            const {
                latitude1,
                longitude1,
                latitude2 = false,
                longitude2 = false,
                latlongtype = false,
                latlongaccuracy = false,
                row_number,
            } = point_data_dict;

            let vectors = [];

            if(latitude2===false || longitude2 === false){

                // a point
                if(latlongaccuracy === false || latlongaccuracy === "0")
                    vectors.push(create_a_point(latitude1,longitude1));

                // a circle
                else
                    vectors.push(
                        L.circle([latitude1, longitude1], {
                            radius: latlongaccuracy
                        }),
                        create_a_point(latitude1, longitude1)
                    );

            }


            else
                vectors.push(
                    latlongtype === 'Line' ?
                        // a line
                        new L.Polyline([
                            [latitude1, longitude1],
                            [latitude2, longitude2]
                        ], {
                            weight: 3,
                            opacity: 0.5,
                            smoothFactor: 1
                        }) :
                        // a polygon
                        L.polygon([
                            [latitude1, longitude1],
                            [latitude2, longitude1],
                            [latitude2, longitude2],
                            [latitude1, longitude2]
                        ]),
                    create_a_point(latitude1, longitude1),
                    create_a_point(latitude2, longitude2)
                );


            vectors.map(vector=>{
                vector.addTo(map);
                vector.on('click',()=>{
                    const selected_column =
                        typeof this.hot.getSelectedLast() === "undefined" ?
                            0 :
                            this.hot.getSelectedLast()[1];
                    this.hot.selectCell(row_number,selected_column);  // select first cell to scroll the view
                    this.hot.selectRows(row_number);  // select an entire row
                });
            });

            index++;
        });

    },
});

module.exports = function loadDataset(id, showStatusDialog = false) {
    const dialog = $('<div><div class="progress-bar"></div></div>').dialog({
        title: 'Loading',
        modal: true,
        open(evt, ui) {
            $('.ui-dialog-titlebar-close', ui.dialog).hide();
        },
        close() {
            $(this).remove();
        }
    });
    $('.progress-bar', dialog).progressbar({value: false});

    $.get(`/api/workbench/dataset/${id}/`).done(dataset => {
        dialog.dialog('close');

        const view = new WBView({
            dataset,
            showStatusDialog
        }).on('refresh', () =>
            loadDataset(id, true)
        );
        app.setTitle(dataset.name);
        app.setCurrentView(view);
    });
};
