"use strict";

var $      = require('jquery');
var _      = require('underscore');
var moment = require('moment');

var UIPlugin      = require('./uiplugin.js');
var template = require('./templates/partialdateui.html');
var dateFormatStr = require('./dateformat.js');
var ToolTipMgr    = require('./tooltipmgr.js');
var saveblockers  = require('./saveblockers.js');
const formsText = require('./localization/forms').default;

function isInputSupported(type) {
	var input = document.createElement('input');
	var value = 'a';
	input.setAttribute('type', type);
	input.setAttribute('value', value);
	return (input.value !== value);
}

    var precisions = ['full', 'month-year', 'year'];

module.exports =  UIPlugin.extend({
        __name__: "PartialDateUI",
        events: {
            'change select': 'updatePrecision',
            'change input.partialdateui-full': 'updateFullDate',
            'change input.partialdateui-month': 'updateMonth',
            'change input.partialdateui-year': 'updateYear',
            'paste input.partialdateui-full': 'pasteFullDate',
            'paste input.partialdateui-month': 'pasteMonth',
            'click a.partialdateui-current-date': 'setToday'
        },
        render: function() {
            var init = this.init;
            var disabled = this.$el.prop('disabled');
            var ui = $(template({formsText}));
            var select = ui.find('select');
            select.prop('id', this.$el.prop('id'));

            if (this.model.isNew() && ("" + this.$el.data('specify-default')).toLowerCase() === 'today')  {
                this.model.set(init.df.toLowerCase(), moment().format('YYYY-MM-DD'));
            }

            this.$el.replaceWith(ui);
            this.setElement(ui);
            ui.find('select, input').prop('readonly', disabled);

            this.inputFull = this.$('input.partialdateui-full');
            this.inputMonth = this.$('input.partialdateui-month');
            this.inputYear = this.$('input.partialdateui-year');
            this.inputTypeDateSupported = isInputSupported('date');
            this.inputTypeMonthSupported = isInputSupported('month');

            if (disabled) {
                select.hide();
                this.$('.partialdateui-current-date').hide();
            }
            if(this.inputTypeDateSupported && this.inputTypeMonthSupported)
                this.$('.partialdateui-current-date').hide();

            var label = ui.parents().last().find('label[for="' + select.prop('id') + '"]');
            label.text() || label.text(this.model.specifyModel.getField(init.df).getLocalizedName());

            this.inputFull.attr({
                'size': dateFormatStr().length + 1,
                'placeholder': dateFormatStr()
            });

            this.toolTipMgr = new ToolTipMgr(this).enable();
            this.saveblockerEhancement = new saveblockers.FieldViewEnhancer(this, init.df);

            var setInput = this.setInput.bind(this);
            var setPrecision = this.setPrecision.bind(this);
            this.model.on('change:' + init.df.toLowerCase(), setInput);
            this.model.on('change:' + init.tp.toLowerCase(), setPrecision);

            this.model.fetchIfNotPopulated().done(setInput).done(setPrecision);
            return this;
        },
        setInput: function() {
            var value = this.model.get(this.init.df);
            var m = moment(value);

            // If input[type="date"] or input[type="month"] is not supported,
            // present the date in a more human readable format
            const inputFullFormat = this.inputTypeDateSupported ?
                  'YYYY-MM-DD' :
                  dateFormatStr();
            const inputMonthFormat = this.inputTypeMonthSupported ?
                  'YYYY-MM' :
                  'MM/YYYY';
            this.inputFull.val(value ? m.format(inputFullFormat) : '');
            this.inputMonth.val(value ? m.format(inputMonthFormat) : '');
            this.inputYear.val(value ? m.format('YYYY') : '');
        },
        setPrecision: function() {
            var defaultPrec;
            switch(this.init.defaultprecision) {
            case 'year':
                defaultPrec = 3;
                break;
            case 'month':
                defaultPrec = 2;
                break;
            default:
                defaultPrec = 1;
            }
            var precisionIdx = this.model.get(this.init.tp) || defaultPrec;
            _.each(precisions, function(p, i) {
                this.$("td.partialdateui-" + p)[(i + 1 === precisionIdx) ? 'show' : 'hide']();
            }, this);

            this.$('select').val(precisionIdx);
        },
    updatePrecision: function() {
        var precisionIdx = parseInt(this.$('select').val());
        this.model.set(this.init.tp, precisionIdx);
        this.setInput();
        this.model.saveBlockers.remove('invaliddate:' + this.init.df);

        var m = moment(this.model.get(this.init.df));
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
            } else {
                this.model.saveBlockers.add('invaliddate:' + this.init.df, this.init.df,
                                            invalidMessage || formsText('invalidDate'));
            }
        },
        updateFullDate: function() {
            let val = this.inputFull.val().trim() || null;
            // The date would be in this format if browser supports
            // input[type="date"]
            let m = val && moment(val, 'YYYY-MM-DD', true);
            // As a fallback, and on manual paste, default to preferred
            // date format
            if(m && !m.isValid())
                m = moment(val, dateFormatStr(), true);
            this.updateIfValid(m, formsText('requiredFormat')(dateFormatStr()));
        },
        updateMonth: function() {
            let val = this.inputMonth.val().trim() || null;
            // The date would be in this format if browser supports
            // input[type="date"]
            let m = val && moment(val, 'YYYY-MM', true);
            // As a fallback, and on manual paste, default to
            // the format used in the placeholder
            if(m && !m.isValid())
                m = moment(val, 'MM/YYYY', true);
            this.updateIfValid(m);
        },
        updateYear: function() {
            var orig = this.model.get(this.init.df);
            var val = parseInt(this.$('input.partialdateui-year:visible').val(), 10);
            var m = (orig ? moment(orig) : moment()).year(val);
            this.updateIfValid(m);
        },
        setToday: function() {
            this.updateIfValid(moment());
        },
        pasteFullDate(event){
            this.pasteDate(event, this.updateFullDate.bind(this))
        },
        pasteMonth(event){
            this.pasteDate(event, this.updateMonth.bind(this))
        },
        pasteDate(event, updateHandler){
            const initialType = event.target.type;
            event.target.type = 'text';
            try {
                event.target.value = event.originalEvent.clipboardData.getData('text/plain');
                updateHandler();
            } catch {
                return;
            }

            event.preventDefault();
            event.target.type = initialType;
        },
    }, { pluginsProvided: ['PartialDateUI'] });

