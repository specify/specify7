"use strict";

var $ = require('jquery');
var _ = require('underscore');

var processField           = require('./specifyformfields.js');
var parseSpecifyProperties = require('./parsespecifyproperties.js');
var processColumnDef       = require('./processcolumndef.js');

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
                    id && control.prop('id', id);
                    initialize && control.attr('data-specify-initialize', initialize);
                    if (isRequired && isRequired.toLowerCase() === 'true') {
                        control.addClass('specify-required-field');
                    }
                    if (ignore && ignore.toLowerCase() == 'true') {
                        control.addClass('specify-ignore-field');
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
                return $('<td class="specify-form-label">').append(label);
            },
            separator: function() {
                var label = cell.attr('label');
                var elem = label ? $('<h3>').text(label) : $('<hr>');
                return $('<td>').append(elem.addClass('separator'));
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
                    id && td.prop('id', id);
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
                var button = $('<input type=button>').attr({
                    value: cell.attr('label'),
                    name: cell.attr('name'),
                    "class": "specify-uicommand",
                    action: cell.attr('action'),
                    'data-specify-initialize': cell.attr('initialize'),
                    disabled: doingFormTable || mode === 'view'
                });
                return $('<td>').append(button);
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

module.exports = processCell;

