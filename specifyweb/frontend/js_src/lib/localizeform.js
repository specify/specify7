"use strict";

import $ from 'jquery';

import {getModel} from './schema';
import * as stringLocalization from './stringlocalization';
import {className} from './components/basic';


function localize(s) {
        return stringLocalization.localizeFrom(['views', 'global_views'], s);
    }

    function getControlFieldName(control) {
        return control.attr('name') ||
            control.closest('[data-specify-field-name]').data('specify-field-name');
    }

export default function(formNode) {
        var form = $(formNode);
        const model = getModel(form.data('specify-model') ?? '');
        if (typeof model === 'undefined') return;

        $('.specify-form-header', form).prepend(
            $('<h2>').text(model.label)
        );

        var fillinLabel = function() {
            var label = $('label', this);
            const setText = (text) => {
              label.text(text);
              if(text.trim().length===0)
                $(this)[0].setAttribute('aria-hidden','true');
            }
            if (label.text().trim()) {
                // the label was hard coded in the form
                setText(localize(label.text()));
                return;
            }

            const cellId = label.attr('data-specify-label-id');
            if(model.name === 'Accession' && cellId === 'divLabel'){
                label.text(localize('Division'));
                return;
            }

            var forId = label.prop('for');
            if (!forId){
              // Not much we can do about that
              setText('');
              return;
            }

            var control = $('#' + forId, form);
            var override = control.data('specify-field-label-override');
            if (override !== undefined) {
                setText(localize(override));
                return;
            }

            var fieldname = getControlFieldName(control);
            if (!fieldname) return; // probably a label for a plugin

            if(model.name === 'Accession' && fieldname === 'divisionCBX'){
                label.text(localize('Division'));
                return;
            }

            var field = model.getField(fieldname);
            field && setText(field.label);
            var title = field && field.getLocalizedDesc();
            if(title && title !== label.text())
              label.attr('title', title);
        };

        if ($('.specify-formtable', form).length) {
            $('th', form).each(fillinLabel);
        } else {
            $('.specify-form-label', form).each(fillinLabel);

            $('.specify-field:checkbox', form).each(function() {
                fillinLabel.apply($(this).parent());
            });

            $('.specify-field', form).each(function() {
                var control = $(this);
                var fieldName = getControlFieldName(control);
                if (fieldName) {
                    var field = model.getField(fieldName);
                    if (field && field.isRequiredBySchemaLocalization())
                        control[0].required = true;
                } else {
                    console.error("control without name", this);
                }
            });
        }

        $(`.${className.subViewHeader}`, form).each(function() {
            var fieldname = $(this).parent().data('specify-field-name');
            var label = model.getField(fieldname).label;
            $('.specify-subview-title', this).text(label);
        });
    };
