"use strict";

var $                = require('jquery');
var _                = require('underscore');

module.exports = function(doingFormTable, mode, cell, id) {
        var uitype = cell.attr('uitype');
        if (!uitype) {
            console.error('field is missing uitype', cell);
            uitype = 'text';
        }

        var makeField = {
            checkbox: function() {
                var control = $('<input type=checkbox class="specify-field">');
                control.attr('disabled', doingFormTable || mode === 'view');
                if (doingFormTable) {
                    return control.attr('data-specify-field-label-override', cell.attr('label'));
                }
                var label = $('<label class="specify-checkbox-label">');
                label.prop('for', id);
                label.text(cell.attr('label'));
                return control.add(label);
            },
            textarea: function () {
                if (doingFormTable || mode === 'view')
                    return $('<input type=text class="specify-field" readonly>');
                var control = $('<textarea class="specify-field">)');
                control.attr('rows', cell.attr('rows'));
                return control;
            },
            textareabrief: function() {
                if (doingFormTable || mode == 'view')
                    return $('<input type=text class="specify-field" readonly>');
                return $('<textarea class="specify-field">').attr('rows', cell.attr('rows') || 1);
            },
            combobox: function() {
                var control = $('<select class="specify-combobox specify-field">');
                control.attr({'disabled': doingFormTable || mode === 'view',
                              'data-specify-picklist': cell.attr('picklist')});
                return control;
            },
            spinner: function() {
                return $('<input type=text class="specify-spinner specify-field">')
                    .attr('readonly', doingFormTable || mode === 'view');
            },
            querycbx: function() {
                return $('<input type=text class="specify-querycbx specify-field">')
                    .attr('readonly', doingFormTable || mode === 'view');
            },
            text: function() {
                return $('<input type=text class="specify-field">')
                    .attr('value', cell.attr('default'))
                    .attr('readonly', doingFormTable || mode === 'view');
            },
            dsptextfield: function() {
                return $('<input type=text class="specify-field" readonly>');
            },
            formattedtext: function() {
                return $('<input type=text class="specify-formattedtext specify-field">')
                    .attr('readonly', doingFormTable || mode === 'view');
            },
            label: function() {
                return $('<input type=text class="specify-field" readonly>');
            },
            plugin: function() {
                return $('<input type=button value="plugin" class="specify-uiplugin specify-field">')
                    .attr('disabled', doingFormTable || mode === 'view');
            },
            browse: function() {
                return $('<input type=file class="specify-field">');
            }
        };

        var maker = makeField[uitype];
        if (!maker) {
            console.error('unknown field uitype:', uitype);
            maker = makeField['text'];
        }

        return maker();
    };
