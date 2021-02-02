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
const {upload_plan_to_mappings_tree} = require('./wbplanviewconverter.ts');
const {mappings_tree_to_array_of_mappings} = require('./wbplanviewtreehelper.ts');
const {get_mapping_line_data_from_mapping_path} = require('./wbplanviewnavigator.ts');
const fetchDataModelPromise = require('./wbplanviewmodelfetcher.ts').default;
const icons = require('./icons.js');

const template = require('./templates/wbview.html');

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
        'click .wb-show-upload-view':'displayUploadedView',
        'click .wb-unupload':'unupload'
    },
    initialize({dataset, showStatusDialog}) {
        this.dataset = dataset;
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
        const onChanged = this.spreadSheetChanged.bind(this);

        this.hot = new Handsontable(this.$('.wb-spreadsheet')[0], {
            height: this.calcHeight(),
            data: this.data,
            cells: this.defineCell.bind(this, this.dataset.columns.length),
            colHeaders: (col)=>
                `<div class="wb-header-${col}">
                    <span class="wb-header-icon"></span>
                    <span class="wb-header-name">${this.dataset.columns[col]}</span>
                </div>`,
            columns: this.dataset.columns.map((c, i) => ({data: i})) ,
            minSpareRows: 0,
            comments: true,
            rowHeaders: true,
            manualColumnResize: true,
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
                    'fill_down_with_increment': {
                        name: 'Fill down with increment',
                        disabled: function(){
                            const selections = this.getSelected();

                            return (
                                    typeof selections === "undefined" ||
                                    selections.every(selection=>
                                        selection[0]===selection[2]
                                    )
                                );
                        },
                        callback: (_, selections) =>
                            selections.map(selection=>{

                                const start_column = selection.start.col;
                                const end_column = selection.end.col;

                                // if selection spans over several columns, run fill down for each individually
                                for(let current_column=start_column; current_column<=end_column; current_column++)
                                    this.fillDownCells({
                                        start_row: selection.start.row,
                                        end_row: selection.end.row,
                                        col: current_column,
                                    });
                            }) && this.hot.deselectCell()
                    },
                    'separator_2': '---------',
                    'undo': 'undo',
                    'redo': 'redo',
                }
            },
            stretchH: 'all',
            readOnly: this.uploaded,
            afterCreateRow: (index, amount) => { this.onChanged(); },
            afterRemoveRow: () => { if (this.hot.countRows() === 0) { this.hot.alter('insert_row', 0); } onChanged();},
            afterSelection: (r, c) => this.currentPos = [r,c],
            afterChange: (change, source) => source === 'loadData' || onChanged(change),
        });

        $(window).resize(this.resize.bind(this));

        this.getValidationResults();

        fetchDataModelPromise().then(this.identifyMappedHeaders.bind(this));

        return this;
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
                base_table_name,
                mappings_tree: mappingsTree
            } = upload_plan_to_mappings_tree(this.dataset.columns, this.dataset.uploadplan);
            const arrayOfMappings = mappings_tree_to_array_of_mappings(mappingsTree);
            const mappedHeadersAndTables = Object.fromEntries(
                arrayOfMappings.map(mappingsPath =>
                    [
                        mappingsPath.slice(-1)[0],
                        icons.getIcon(
                            get_mapping_line_data_from_mapping_path({
                                base_table_name,
                                mapping_path: mappingsPath.slice(0, -3),
                                iterate: false,
                                custom_select_type: 'simple',
                                show_hidden_fields: false,
                            })[0]?.table_name || '',
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

            console.log(mappedHeadersAndTables);
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

        const cols = this.hot.countCols();
        const headerToCol = {};
        for (let i = 0; i < cols; i++) {
            headerToCol[this.getHeaderNameFromHTML(this.hot.getColHeader(i))] = i;
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

        if(this.showStatusDialog){
            $(`<div>
                ${
                    cellCounts.invalid_cells === 0 ?
                        `Upload completed successfully.<br>
                        You can open the 'View' menu to see a detailed breakdown of the upload results.` :
                        `Upload failed with ${cellCounts.invalid_cells} invalid cells.<br>
                        Please review the validation messages and repeat the upload process.`
                }
            </div>`).dialog({
                title: cellCounts.invalid_cells === 0 ?
                    'Upload completed successfully' :
                    'Upload failed due to validation errors',
                modal: true,
                buttons: {
                    'Close': function() { $(this).dialog('close'); },
                    ...(
                        cellCounts.invalid_cells === 0 ?
                            {
                                'View upload results': this.displayUploadedView.bind(this),
                            } :
                            {}
                    )
                }
            });
            this.showStatusDialog = false;
        }

        this.hot.render();
    },
    getHeaderNameFromHTML: (headerHTML)=>
        /<span class="wb-header-name">(?<headerName>.*?)<\/span>/.exec(headerHTML)?.groups?.headerName || '',
    parseRowValidationResult(row, result) {
        const cols = this.hot.countCols();
        const headerToCol = {};
        for (let i = 0; i < cols; i++) {
            headerToCol[this.getHeaderNameFromHTML(this.hot.getColHeader(i))] = i;
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
        };

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

        if (this.dataset.uploadplan && change) {
            change.forEach(([row]) => {
                const rowData = this.hot.getDataAtRow(row);
                const data = Object.fromEntries(rowData.map((value, i) =>
                    [this.getHeaderNameFromHTML(this.hot.getColHeader(i)), value]
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
        return $(window).height() - this.$el.offset().top - 50;
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
                    'Create': openPlan,
                    'Cancel': function() { $(this).dialog('close'); }
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
    export: function() {
        const data = Papa.unparse({
            fields: this.hot.getColHeader().map(this.getHeaderNameFromHTML),
            data: this.dataset.data
        });
        const wbname = this.dataset.name;
        const filename = wbname.match(/\.csv$/) ? wbname : wbname + '.csv';
        const blob = new Blob([data], {type: 'text/csv;charset=utf-8;'});
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.setAttribute('download', filename);
        a.click();
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
            dataset: dataset, showStatusDialog
        }).on('refresh', () => loadDataset(id, true));
        app.setCurrentView(view);
    });
};
