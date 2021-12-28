"use strict";


import $ from 'jquery';

import UIPlugin from './uiplugin';
import template from './templates/partialdateui.html';
import dateFormat from './dateformat';
import formsText from './localization/forms';
import commonText from './localization/common';
import {addValidationAttributes, resolveParser} from './uiparse';
import dayjs, {getDateInputValue} from './dayjs';

function isInputSupported(type) {
    var input = document.createElement('input');
    var value = 'a';
    input.setAttribute('type', type);
    input.setAttribute('value', value);
    return (input.value !== value);
}
    var precisions = ['full', 'month-year', 'year'];

export default UIPlugin.extend({
        __name__: "PartialDateUI",
        events: {
            'change select': 'updatePrecision',
            'blur input.partialdateui-full': 'updateFullDate',
            'blur input.partialdateui-month': 'updateMonth',
            'change input.partialdateui-year': 'updateYear',
            'paste label.partialdateui-full': 'pasteFullDate',
            'paste label.partialdateui-month': 'pasteMonth',
            'click button.partialdateui-current-date': 'setToday'
        },
        render: function() {
            var init = this.init;
            var disabled = this.$el.prop('disabled');
            var ui = $(template({formsText, commonText}));
            var select = ui.find('select');
            this.id = this.$el.prop('id');

            this.destructors = [];

            if (this.model.isNew() && ("" + this.$el.data('specify-default')).toLowerCase() === 'today')  {
                this.model.set(init.df.toLowerCase(), getDateInputValue(new Date()));
            }

            this.$el.replaceWith(ui);
            this.setElement(ui);
            ui.find('select, input').prop('readonly', disabled);

            this.inputFull = this.$('input.partialdateui-full');
            this.inputMonth = this.$('input.partialdateui-month');
            this.inputYear = this.$('input.partialdateui-year');
            this.inputTypeDateSupported = isInputSupported('date');
            this.inputTypeMonthSupported = isInputSupported('month');

            const field = {type: 'year'};
            const parser = resolveParser(field);
            addValidationAttributes(this.inputYear[0], field, parser);

            if (disabled) {
                select.hide();
                this.$('.partialdateui-current-date').hide();
            }
            if(this.inputTypeDateSupported && this.inputTypeMonthSupported)
                this.$('.partialdateui-current-date').hide();

            this.label = ui.parents().last().find(`label[for="${this.id}"]`);
            this.label.text() || this.label.text(this.model.specifyModel.getField(init.df).getLocalizedName());


            const inputs = [
                this.inputFull[0],
                this.inputMonth[0],
                this.inputYear[0]
            ];
            inputs.forEach((input, index)=>{
                input.id = `${this.id}-${precisions[index]}`;
                this.model.saveBlockers?.linkInput(input,init.df);
                this.destructors.push(()=>this.model.saveBlockers?.unlinkInput(input));
            });

            var setInput = this.setInput.bind(this);
            this.model.on('change:' + init.df.toLowerCase(), setInput);
            this.model.on(
              'change:' + init.tp.toLowerCase(),
              this.setPrecision.bind(this, true)
            );

            this.model
              .fetchIfNotPopulated()
              .done(setInput)
              .done(this.setPrecision.bind(this, false));
            return this;
        },
        remove(){
            this.destructors.forEach(destructor=>destructor());
            UIPlugin.prototype.remove.call(this);
        },
        setInput: function() {
            var value = this.model.get(this.init.df);
            var m = dayjs(value);

            // If input[type="date"] or input[type="month"] is not supported,
            // present the date in a more human readable format
            const inputFullFormat = this.inputTypeDateSupported ?
                  'YYYY-MM-DD' :
                  dateFormat();
            const inputMonthFormat = this.inputTypeMonthSupported ?
                  'YYYY-MM' :
                  'MM/YYYY';
            this.inputFull.val(value ? m.format(inputFullFormat) : '');
            this.inputMonth.val(value ? m.format(inputMonthFormat) : '');
            this.inputYear.val(value ? m.format('YYYY') : '');

            if(!this.inputTypeDateSupported)
                this.inputFull.attr({
                    minlength: dateFormat().length,
                    maxlength: dateFormat().length,
                    placeholder: dateFormat(),
                });

            if(!this.inputTypeMonthSupported)
                this.inputMonth.attr({
                    pattern: '/(?:0\d|1[012])-\d{4}/',
                    placeholder: 'MM/YYYY',
                    title: formsText('invalidDate'),
                });
        },
        setPrecision: function(moveFocus) {
            const defaultPrecision =
              { year: 3, month: 2 }[this.init.defaultprecision] ?? 1;
            const precisionIdx = this.model.get(this.init.tp) || defaultPrecision;
            precisions.forEach((name, index)=>{
                const cell = this.$(`label.partialdateui-${name}`);
                const selected = index + 1 === precisionIdx;
                cell[selected ? 'show' : 'hide']();
                if(selected){
                    this.label[0].setAttribute('for', `${this.id}-${name}`);
                    if(moveFocus)
                        cell.find('input')[0].focus();
                }
            });

            this.$('select').val(precisionIdx);
        },
    updatePrecision: function() {
        var precisionIdx = parseInt(this.$('select').val());
        this.model.set(this.init.tp, precisionIdx);
        this.setInput();
        this.model.saveBlockers.remove('invaliddate:' + this.init.df);

        var m = dayjs(this.model.get(this.init.df));
        switch (precisions[precisionIdx-1]) {
        case 'year':
            m = m.month(0);
        case 'month-year':
            m = m.date(1);
        }
        this.updateIfValid(m);
    },
        updateIfValid: function(m, invalidMessage) {
            if (m == null) {
                this.model.set(this.init.df, null);
                this.model.set(this.init.tp, null); // set precision to null if value is null
                this.setInput();
                this.model.saveBlockers.remove('invaliddate:' + this.init.df);
                console.log('setting date to null');
            } else if (m.isValid()) {
                var value = m.format('YYYY-MM-DD');
                this.model.set(this.init.df, value);
                // precision should be consistent with UI
                this.model.set(this.init.tp, parseInt(this.$('select').val()));
                this.setInput();
                console.log('setting date to', value);
                this.model.saveBlockers.remove('invaliddate:' + this.init.df);

                this.inputFull.title = m.format(dateFormat());
            } else
                this.model.saveBlockers.add('invaliddate:' + this.init.df, this.init.df,
                                            invalidMessage || formsText('invalidDate'));
        },
        updateFullDate: function() {
            let val = this.inputFull.val().trim() || null;
            // The date would be in this format if browser supports
            // input[type="date"]
            let m = val && dayjs(val, 'YYYY-MM-DD', true);
            // As a fallback, and on manual paste, default to preferred
            // date format
            if(m && !m.isValid())
                m = dayjs(val, dateFormat(), true);
            this.updateIfValid(m, formsText('requiredFormat')(dateFormat()));
        },
        updateMonth: function() {
            let val = this.inputMonth.val().trim() || null;
            // The date would be in this format if browser supports
            // input[type="date"]
            let m = val && dayjs(val, 'YYYY-MM', true);
            // As a fallback, and on manual paste, default to
            // the format used in the placeholder
            if(m && !m.isValid())
                m = dayjs(val, 'MM/YYYY', true);
            this.updateIfValid(m);
        },
        updateYear: function() {
            var orig = this.model.get(this.init.df);
            var val = parseInt(this.$('input.partialdateui-year:visible').val(), 10);
            var m = (orig ? dayjs(orig) : dayjs()).year(val);
            this.updateIfValid(m);
        },
        setToday: function() {
            this.updateIfValid(dayjs());
        },
        pasteFullDate(event){
            handleDatePaste(event.originalEvent, this.updateFullDate.bind(this))
        },
        pasteMonth(event){
            handleDatePaste(event.originalEvent, this.updateMonth.bind(this))
        },
    }, { pluginsProvided: ['PartialDateUI'] });

export function handleDatePaste(event, updateHandler){
    const input =
        event.target.tagName === 'INPUT' ?
            event.target :
            event.target.getElementsByTagName('input')[0];
    const initialType = input.type;
    input.type = 'text';
    try {
        input.value = (
            event.clipboardData ??
            window.clipboardData
        ).getData('text/plain');
        updateHandler();
    } catch (error) {
        console.error(error);
    }

    event.preventDefault();
    input.type = initialType;
}
