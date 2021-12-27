"use strict";

import $ from 'jquery';

export default function(doingFormTable, mode, cell, id) {
        var uitype = cell.attr('uitype');
        if (!uitype) {
            console.error('field is missing uitype', cell);
            uitype = 'text';
        }

        const isReadOnly = doingFormTable
            || mode === 'view'
            || cell.attr('readonly') === 'true';

        var makeField = {
            checkbox: function() {
                var control = $('<input type="checkbox" class="specify-field">');

                control.prop('disabled',isReadOnly);
                if (cell.attr('default') != null) {
                    control.attr('data-specify-default', cell.attr('default') === 'true');
                }
                if (doingFormTable) {
                    return control.attr('data-specify-field-label-override', cell.attr('label'));
                }
                var label = $('<label class="specify-checkbox-label">');
                label.prop('for', id);
                label.text(cell.attr('label'));
                return control.add(label);
            },
            textarea: function () {
                if (isReadOnly)
                    return $('<input type="text" class="specify-field" readonly>');
                var control = $('<textarea class="specify-field"></textarea>');
                control.attr('rows', cell.attr('rows'));
                return control;
            },
            textareabrief: function() {
                if (isReadOnly)
                    return $('<input type="text" class="specify-field" readonly>');
                return $('<textarea class="specify-field"></textarea>').attr('rows', cell.attr('rows') || 1);
            },
            combobox: function() {
                const control= $(`<select
                    class="specify-combobox specify-field"
                ></select>`);
                control.attr({'disabled': isReadOnly,
                              'data-specify-picklist': cell.attr('picklist'),
                              'data-specify-default': cell.attr('default')});
                return control;
            },
            spinner: function() {
                return $('<input type="number" class="specify-spinner specify-field">')
                    .prop('readonly',isReadOnly);
            },
            querycbx: function() {
                return $('<input type="text" class="specify-querycbx specify-field">')
                    .prop('readonly',isReadOnly);
            },
            text: function() {
                return $('<input type="text" class="specify-field">')
                    .attr('value', cell.attr('default'))
                    .prop('readonly', isReadOnly);
            },
            dsptextfield: function() {
                return $('<input type="text" class="specify-field" readonly>')
                    .attr('value', cell.attr('default'));
            },
            formattedtext: function() {
                return $('<input type="text" class="specify-formattedtext specify-field">')
                    .attr('value', cell.attr('default'))
                    .prop('readonly', isReadOnly);
            },
            label: function() {
                return $('<input type="text" class="specify-field" readonly>');
            },
            plugin: function() {
                return $(`<button
                    type="button"
                    class="magic-button specify-uiplugin specify-field"
                    data-specify-default="${cell.attr('default')}"
                    ${isReadOnly ? 'disabled' : ''}
                >
                    plugin
                </button>`);
            },
            browse: function() {
                return $('<input type="file" class="specify-field">');
            }
        };

        var maker = makeField[uitype];
        if (!maker) {
            console.error('unknown field uitype:', uitype);
            maker = makeField['text'];
        }

        return maker();
    };
