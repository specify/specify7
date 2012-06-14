define([
    'jquery', 'underscore', 'specifyformfields', 'parsespecifyproperties', 'processcolumndef'
], function($, _, processField, parseSpecifyProperties, processColumnDef) {
    "use strict";
    function processCell(formNumber, doingFormTable, cellNode) {
        var cell = $(cellNode);
        var id = cell.attr('id') ? 'specify-field-' + formNumber + '-' + cell.attr('id') : undefined;
        var byType = {
            field: function() {
                var td = $('<td>');
                var fieldName = cell.attr('name');
                var initialize = cell.attr('initialize');
                var isRequired = cell.attr('isrequired');
                processField(doingFormTable, cell, id).appendTo(td);
                var control = td.find('.specify-field');
                if (control) {
                    control.attr('name', fieldName);
                    id && control.prop('id', id);
                    initialize && control.attr('data-specify-initialize', initialize);
                    if (isRequired && isRequired.toLowerCase() === 'true') {
                        control.addClass('specify-required-field');
                    }
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
                var label = cell.attr('label'),
                elem = label ? $('<h3>').text(label) : $('<hr>');
                return $('<td>').append(elem.addClass('separator'));
            },
            subview: function() {
                var td = $('<td class="specify-subview">').attr({
                    'data-specify-field-name': cell.attr('name'),
                    'data-specify-viewname': cell.attr('viewname'),
                    'data-specify-viewtype': cell.attr('defaulttype')
                });
                var props = parseSpecifyProperties(cell.attr('initialize'));
                if (props.btn === 'true') {
                    td.addClass('specify-subview-button');
                    id && td.prop('id', id);
                    td.attr('data-specify-initialize', cell.attr('initialize'));
                    props.align && td.addClass('align-' + props.align);
                }
                return td;
            },
            panel: function() {
                var table = processColumnDef(cell.attr('coldef'));
                cell.children('rows').children('row').each(function () {
                    var tr = $('<tr>').appendTo(table);
                    $(this).children('cell').each(function() {
                        tr.append(processCell(formNumber, doingFormTable, this));
                    });
                });
                return $('<td>').append(table);
            },
	    command: function() {
		var button = $('<input type=button>').attr({
		    value: cell.attr('label'),
		    name: cell.attr('name')
		});
		return $('<td>').append(button);
	    },
            other: function() {
                return $('<td>').text("unsupported cell type: " + cell.attr('type'));
            }
        },

        td = (byType[cell.attr('type')] || byType.other)(),
        colspan = cell.attr('colspan');
        if (!doingFormTable && colspan) {
            td.attr('colspan', Math.ceil(parseInt(colspan, 10)/2));
        }
        return td;
    };

    return processCell;
});