define([
    'jquery', 'underscore', 'backbone', 'fieldformat', 'uiparse', 'uiinputfield', 'saveblockers', 'tooltipmgr'
], function($, _, Backbone, fieldformat, uiparse, UIFieldInput, saveblockers, ToolTipMgr) {
    "use strict";

    var intParser = uiparse.bind(null, {type: 'java.lang.Integer'});
    var stringParser = uiparse.bind(null, {type: 'java.lang.String'});

    var FieldInputUI = Backbone.View.extend({
        __name__: "FieldInputUI",
        opName: 'NA',
        format: false,
        input: '<input type="text">',
        initialize: function(options) {
            this.field = options.field;
            this.isDatePart = options.isDatePart;
            this.isTreeField = options.isTreeField;

            this.inputFormatter = (this.isDatePart || this.isTreeField) ? null :
                this.field.getUIFormatter();
            this.outputFormatter = (this.isDatePart || this.isTreeField) ? null :
                function(value) { return fieldformat(options.field, value); };
            this.parser = this.isDatePart ? intParser : this.isTreeField ? stringParser :
                uiparse.bind(null, this.field);
            this.values = [];

            // A dummy model to keep track of invalid values;
            this.model = new Backbone.Model();
            this.model.saveBlockers = new saveblockers.SaveBlockers(this.model);
        },
        getValue: function() {
            return this.opName == 'Between' ? this.values.join(',') : this.values[0];
        },
        setValue: function(value) {
            var values = this.opName == 'Between' ? value.split(',') : [value];
            this.values = values = this.format && this.outputFormatter ? _.map(values, this.outputFormatter) : values;
            _.each(this.inputUIs, function(ui, i) { ui.fillIn(values[i]); });
        },
        render: function() {
            this.$el.empty();
            $('<a class="field-operation">').text(this.opName).appendTo(this.el);
            this.input && $(this.input).appendTo(this.el);
            this.inputUIs = _.map(this.$('input'), this.addUIFieldInput, this);
            return this;
        },
        addUIFieldInput: function(el, i) {
            var ui = new UIFieldInput({
                el: el,
                model: this.model,
                formatter: this.inputFormatter,
                parser: this.parser
            }).render()
                .on('changed', this.inputChanged.bind(this, i))
                .on('addsaveblocker', this.addSaveBlocker.bind(this, i))
                .on('removesaveblocker', this.removeSaveBlocker.bind(this, i));

            new saveblockers.FieldViewEnhancer(ui, this.cid + '-' + i);
            new ToolTipMgr(ui).enable();
            return ui;
        },
        inputChanged: function(idx, value) {
            this.values[idx] = value;
            this.trigger('changed', this, this.getValue());
        },
        addSaveBlocker: function(idx, key, message) {
            this.model.saveBlockers.add(key + ":" + this.cid + '-' + idx, this.cid + '-' + idx, message);
        },
        removeSaveBlocker: function(idx, key) {
            this.model.saveBlockers.remove(key + ":" + this.cid + '-' + idx);
        }
    });

    var opInfo = [
        {opName: 'Like', negation: 'Not Like', types: ['strings']},
        {opName: '=', negation: '≠', types: ['strings', 'numbers', 'dates'], format: true},
        {opName: '>', negation: '≯', types: ['numbers', 'dates'], format: true},
        {opName: '<', negation: '≮', types: ['numbers', 'dates'], format: true},
        {opName: '≥', negation: '≱', types: ['numbers'], format: true},
        {opName: '≤', negation: '≰', types: ['numbers'], format: true},
        {opName: 'True', negation: 'Not True', types: ['bools'], input: null},
        {opName: 'False', negation: 'Not False', types: ['bools'], input: null},
        {opName: 'Does not matter', types: ['bools'], input: null},

        {opName: 'Between', negation: 'Not Between', types: ['strings', 'dates', 'numbers'],
         input: '<input type="text"> and <input type="text">', format: true
        },

        {opName: 'In', negation: 'Not In', types: ['strings', 'numbers']},
        {opName: 'Contains', negation: "Doesn't Contain", types: ['strings']},
        {opName: 'Empty', negation: 'Not Empty', types: ['strings', 'bools', 'dates', 'numbers'], input: null},
        {opName: 'True or Null', negation: 'False', types: ['bools'], input: null},
        {opName: 'False or Null', negation: 'True', types: ['bools'], input: null}
    ];

    return _.map(opInfo, function(extras, i) {
        var options = _.extend({ __name__: "OpFieldInputUI", index: i }, extras);
        return FieldInputUI.extend(options);
    });
});
