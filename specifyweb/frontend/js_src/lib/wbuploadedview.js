"use strict";
require ('../css/wbuploaded.css');

const $        = require('jquery');
const Backbone = require('./backbone.js');

const icons = require('./icons.js');

const template = require('./templates/wbuploaded.html');

module.exports = Backbone.View.extend({
    __name__: "WBUploadedView",
    className: "wb-uploaded",
    events: {
        'click .wb-unupload': 'unupload',
        'click .wb-upload-view': 'viewUploadResults',
    },
    initialize({wb, hot, uploadResults, openStatus}) {
        this.wb = wb;
        this.hot = hot;
        this.uploadResultsParsed = false;
        this.uploadedRows = {};
        this.uploadedPicklistItems = {};
        this.uploadResults = uploadResults;
        this.openStatus = openStatus;
    },
    render() {
        return this;
    },
    unupload() {
        $.post(`/api/workbench/unupload/${this.wb.id}/`);
        this.openStatus('upload');
    },
    parseUploadResults(){
        const headers = this.hot.getColHeader();
        this.uploadedRows = Object.fromEntries(
            Object.entries(this.uploadResults.tables).map(([table_name, table_records], column_indexes)=>
                [
                    table_name,
                    {
                        table_label: table_name,
                        column_names: (column_indexes = [ // save list of column indexes to `column_indexes`
                            ...new Set(  // make the list unique
                                table_records.map(({columns})=>
                                    Object.keys(columns)  // get column indexes
                                ).flat()
                            )
                        ]).map(column_index=>  // map column indexes to column headers
                            headers[column_index]
                        ),
                        table_icon: icons.getIcon(table_name),
                        get_record_view_url: row_id => `/specify/view/${table_name}/${row_id}/`,
                        rows: table_records.map(({record_id, row_index, columns})=>({
                            record_id: record_id,
                            row_index: row_index,
                            columns: column_indexes.map(column_index=>
                                ({
                                    column_index: column_index,
                                    cell_value: typeof columns[column_index] === "undefined" ?
                                        '' :
                                        columns[column_index]
                                })
                            )
                        }))
                    }
                ]
            )
        );
    },
    viewUploadResults() {
        if(!this.uploadResultsParsed)
            this.parseUploadResults();

        const dialog = $('<div>').append(template({
            uploadedRows: this.uploadedRows,
            uploadedPicklistItems: this.uploadResults.picklists,
        })).dialog({
            title: "View Upload Results",
            width: 600,
            close: function() { $(this).remove(); },
            buttons: [
                { text: 'Close', click: function() { $(this).dialog('close'); } }
            ]
        });

        dialog[0].addEventListener('click',e=>{

            if(e.target.tagName === "A")
                return true;

            e.preventDefault();

            if(e.target.classList.contains('wb-upload-results-to-recordset'))
                alert('TEST: Record Set');

            else if(e.target.classList.contains('wb-upload-results-to-dataset'))
                alert('TEST: Data Set');

            else if(e.target.closest('.wb-upload-results-header') !== null) {
                const table = e.target.closest('.wb-upload-results-table');
                const class_name = 'wb-upload-results-table-collapsed';
                if(table.classList.contains(class_name))
                    table.classList.remove(class_name);
                else
                    table.classList.add(class_name);
            }

            else if(e.target.closest('.wb-upload-results-cell') !== null){
                const cell = e.target.closest('.wb-upload-results-cell');
                const coordinates = ['row','column'].map(direction=>
                    parseInt(cell.getAttribute(`data-${direction}_index`))
                );
                this.hot.selectCell(...coordinates);
            }

        });
    }
});
