define([
    'jquery', 'underscore', 'uiplugin', 'templates', 'moment', 'dateformat', 'tooltipmgr', 'saveblockers'
], function($, _, UIPlugin, templates, moment, dateFormatStr, ToolTipMgr, saveblockers) {
    "use strict";
    var precisions = ['full', 'month-year', 'year'];

    return UIPlugin.extend({
        __name__: "PartialDateUI",
        events: {
            'change select': 'updatePrecision',
            'change input.partialdateui-full': 'updateFullDate',
            'change input.partialdateui-month': 'updateMonth',
            'change input.partialdateui-year': 'updateYear'
        },
        render: function() {
            var init = this.init;
            var disabled = this.$el.prop('disabled');
            var ui = $(templates.partialdateui());
            var select = ui.find('select');
            select.prop('id', this.$el.prop('id'));

            this.$el.replaceWith(ui);
            this.setElement(ui);
            ui.find('select, input').prop('readonly', disabled);

            disabled && select.hide();

            var label = ui.parents().last().find('label[for="' + select.prop('id') + '"]');
            label.text() || label.text(this.model.specifyModel.getField(init.df).getLocalizedName());

            this.$('input.partialdateui-full').attr('size', dateFormatStr.length);

            this.toolTipMgr = new ToolTipMgr(this).enable();
            this.saveblockerEhancement = new saveblockers.FieldViewEnhancer(this, init.df);

            var setInput = this.setInput.bind(this);
            var setPrecision = this.setPrecision.bind(this);
            this.model.on('change:' + init.df.toLowerCase(), setInput);
            this.model.on('change:' + init.tp.toLowerCase(), setPrecision);

            this.model.fetchIfNotPopulated().done(setInput).done(setPrecision);
            this.model.isNew() && this.model.set(init.tp, 1); // full date
            return this;
        },
        setInput: function() {
            var value = this.model.get(this.init.df);
            var m = moment(value);
            this.$('.partialdateui-full').val(value ? m.format(dateFormatStr) : '');
            this.$('.partialdateui-month').val(value ? m.format('M') : '');
            this.$('.partialdateui-year').val(value ? m.format('YYYY') : '');
        },
        setPrecision: function() {
            var precisionIdx = this.model.get(this.init.tp);
            _.each(precisions, function(p, i) {
                this.$("td.partialdateui-" + p)[(i + 1 === precisionIdx) ? 'show' : 'hide']();
            }, this);
            
            this.$('select').val(precisionIdx);
        },
        updatePrecision: function() {
            this.model.set(this.init.tp, parseInt(this.$('select').val()));
            this.setInput();
            this.model.saveBlockers.remove('invaliddate:' + this.init.df);
        },
        updateIfValid: function(m, invalidMessage) {
            if (m == null) {
                this.model.set(this.init.df, null);
                this.setInput();
                this.model.saveBlockers.remove('invaliddate:' + this.init.df);
                console.log('setting date to null');
            } else if (m.isValid()) {
                var value = m.format('YYYY-MM-DD');
                this.model.set(this.init.df, value);
                this.setInput();
                console.log('setting date to', value);
                this.model.saveBlockers.remove('invaliddate:' + this.init.df);
            } else {
                this.model.saveBlockers.add('invaliddate:' + this.init.df, this.init.df,
                                            invalidMessage || "Invalid date");
            }
        },
        updateFullDate: function() {
            var val = this.$('input.partialdateui-full').val().trim() || null;
            var m = val && moment(val, dateFormatStr, true);
            this.updateIfValid(m, "Required Format: " + dateFormatStr);
        },
        updateMonth: function() {
            var orig = this.model.get(this.init.df);
            var val = parseInt(this.$('input.partialdateui-month').val(), 10);
            var m = (orig ? moment(orig) : moment()).month(val - 1);
            this.updateIfValid(m);
        },
        updateYear: function() {
            var orig = this.model.get(this.init.df);
            var val = parseInt(this.$('input.partialdateui-year:visible').val(), 10);
            var m = (orig ? moment(orig) : moment()).year(val);
            this.updateIfValid(m);
        }
    });
});
