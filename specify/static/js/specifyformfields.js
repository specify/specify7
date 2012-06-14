define(['jquery'], function($) {
    "use strict";
    return function(doingFormTable, cell, id) {
        return {
            checkbox: function() {
                var control = $('<input type=checkbox class="specify-field">');
                var labelOR = cell.attr('label');
                if (doingFormTable) {
                    if (labelOR !== undefined) {
                        control.attr('data-specify-field-label-override', labelOR);
                    }
                    return control.attr('disabled', true);
                }
                var label = $('<label>');
                id && label.prop('for', id);
                labelOR && label.text(cell.attr('label'));
                return control.add(label);
            },
            textarea: function () {
                if (doingFormTable)
                    return $('<input type=text class="specify-field" readonly>');
                var control = $('<textarea class="specify-field">)');
                cell.attr('rows') && control.attr('rows', cell.attr('rows'));
                return control;
            },
            textareabrief: function() {
                if (doingFormTable)
                    return $('<input type=text class="specify-field" readonly>');
                return $('<textarea class="specify-field">').attr('rows', cell.attr('rows') || 1);
            },
            combobox: function() {
                var control = $('<select class="specify-combobox specify-field">');
                control.attr('disabled', doingFormTable);
                return control;
            },
            querycbx: function() {
                return $('<input type=text class="specify-querycbx specify-field">')
                    .attr('readonly', doingFormTable);
            },
            text: function() {
                return $('<input type=text class="specify-field">').attr('readonly', doingFormTable);
            },
            dsptextfield: function() {
                return $('<input type=text class="specify-field" readonly>');
            },
            formattedtext: function() {
                return $('<input type=text class="specify-formattedtext specify-field">')
                    .attr('readonly', doingFormTable);
            },
            label: function() {
                return $('<input type=text class="specify-field" readonly>');
            },
            plugin: function() {
                return $('<input type=button value="plugin" class="specify-uiplugin specify-field">')
                    .attr('disabled', doingFormTable);
            },
            browse: function() {
                return $('<input type=file class="specify-field">');
            }
        }[cell.attr('uitype')]();
    };
});