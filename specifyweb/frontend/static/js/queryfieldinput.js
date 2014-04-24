define([
    'jquery', 'underscore', 'backbone', 'fieldformat'
], function($, _, Backbone, fieldformat) {
    "use strict";

    var FieldInputUI = Backbone.View.extend({
        __name__: "FieldInputUI",
        events: {
            'change input': 'changed'
        },
        opName: 'NA',
        format: false,
        input: '<input type="text">',
        initialize: function(options) {
            this.inputFormatter = options.field.getUIFormatter();
            this.outputFormatter = function(value) { return fieldformat(options.field, value); };
        },
        getValue: function() {
            return this.$('input').val();
        },
        setValue: function(value) {
            this.format && (value = this.outputFormatter(value));
            this.$('input').val(value);
        },
        render: function() {
            this.$el.empty();
            $('<a class="field-operation">').text(this.opName).appendTo(this.el);
            this.input && $(this.input).appendTo(this.el);
            return this;
        },
        changed: function() {
            var value = this.getValue();
            if (this.format && this.inputFormatter) {
                var formatterValues = this.inputFormatter.parse(value); // TODO: don't accept autonumber patterns maybe...
                formatterValues && (value = this.inputFormatter.canonicalize(formatterValues));
                // TODO: make a warning for badly formatted input values?
            }
            this.trigger('changed', this, value);
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
         input: '<input type="text"> and <input type="text">',
         getValue: function() {
             return _.map(this.$('input'), function(input) { return $(input).val(); }).join(',');
         },
         setValue: function(value) {
             var values = value.split(',');
             _.each(this.$('input'), function(input, i) { $(input).val(values[i]); });
         }
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
