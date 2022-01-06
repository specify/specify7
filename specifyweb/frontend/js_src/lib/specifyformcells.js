"use strict";

import $ from 'jquery';
import _ from 'underscore';

import processField from './specifyformfields';
import parseSpecifyProperties from './parsespecifyproperties';
import processColumnDef from './processcolumndef';
import {className} from './components/basic';

function processCell(formNumber, doingFormTable, mode, cellNode) {
        var cell = $(cellNode);
        var id = cell.attr('id') ? 'specify-field-' + formNumber + '-' + cell.attr('id') : undefined;
        var byType = {
            field: function() {
                var td = $('<td>');
                var fieldName = cell.attr('name');
                if (mode === 'search') {
                    // Hack for querycbx search fields that have spurious prefixes.
                    fieldName = fieldName.replace(/^(\w+\.)*/, '');
                }
                var initialize = cell.attr('initialize');
                var isRequired = cell.attr('isrequired');
                var ignore = cell.attr('ignore');
                processField(doingFormTable, mode, cell, id).appendTo(td);
                var control = td.find('.specify-field');
                if (control) {
                    control.attr('name', fieldName);
                    if(id){
                        control.prop('id', id);
                        td.attr('aria-labelledby',id);
                    }
                    initialize && control.attr('data-specify-initialize', initialize);
                    if (isRequired && isRequired.toLowerCase() === 'true') {
                        control[0].required = true;
                    }
                    if (ignore && ignore.toLowerCase() == 'true') {
                        control.addClass('specify-ignore-field');
                        if (fieldName && ['printonsave', 'generateinvoice', 'generatelabelchk'].indexOf(fieldName.toLowerCase()) != 0) {
                            control.addClass('specify-print-on-save');
                        }
                    }
                    doingFormTable && control.addClass('specify-field-in-table');
                }
                return td;
            },
            label: function() {
                var label = $('<label>');
                if (cell.attr('label') !== undefined)
                    label.text(cell.attr('label'));
                var labelfor = cell.attr('labelfor');
                labelfor && label.prop('for', 'specify-field-' + formNumber + '-' + labelfor);
                label.attr('data-specify-label-id',cell.attr('id'));
                return $(`<td class="${className.formLabel}">`).append(label);
            },
            separator: function() {
                var label = cell.attr('label');
                var elem = label ? $('<h3>').text(label) : $('<hr class="border-gray-500 w-full">');
                return $('<td>').append(elem.addClass('border-b border-gray-500'));
            },
            subview: function() {
                var td = $('<td class="specify-subview">').attr({
                    'data-specify-field-name': cell.attr('name'),
                    'data-specify-viewname': cell.attr('viewname'),
                    'data-specify-viewtype': cell.attr('defaulttype'),
                    'data-specify-viewmode': mode
                });
                var props = parseSpecifyProperties(cell.attr('initialize'));
                if (props.btn === 'true') {
                    td.addClass('specify-subview-button');
                    id && td.prop('id',id);
                    td.attr('data-specify-initialize', cell.attr('initialize'));
                    props.align && td.addClass('align-' + props.align);
                    doingFormTable && td.addClass('specify-subview-in-table');
                }
                return td;
            },
            panel: function() {
                var table = processColumnDef(cell.attr('coldef'));
                var rows = cell.children('rows').children('row');
                var cells = function(row) { return $(row).children('cell'); };
                _(rows).each(function (row) {
                    var tr = $('<tr>').appendTo(table);
                    _(cells(row)).each(function(cell) {
                        tr.append(processCell(formNumber, doingFormTable, mode, cell));
                    });
                });
                return $('<td>').append(table);
            },
            command: function() {
                return $('<td>').append($(`<button
                    type="button"
                    name="${cell.attr('name')}"
                    class="button specify-uicommand"
                    action="${cell.attr('action')}"
                    data-specify-initialize="${cell.attr('initialize')}"
                    ${doingFormTable || mode === 'view' ? 'disabled': ''}
                >
                    ${cell.attr('label')}
                </button>`));
            },
            other: function() {
                return $('<td>').text("unsupported cell type: " + cell.attr('type'));
            }
        };

        var td = (byType[cell.attr('type')] || byType.other)();
        var colspan = cell.attr('colspan');
        if (!doingFormTable && colspan) {
            td.attr('colspan', Math.ceil(parseInt(colspan, 10)/2));
        }
        return td;
    };

export default processCell;

