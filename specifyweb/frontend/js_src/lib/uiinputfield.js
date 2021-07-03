"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');
const formsText = require('./localization/forms.tsx').default;

module.exports =  Backbone.View.extend({
    __name__: "UIFieldInput",
    events: {
        'change': 'change',
        'input': 'changing',
        'focus': 'selectAll'
    },
    initialize: function(options) {
        this.readOnly = options.readOnly;
        this.noValidation = options.noValidation;
        this.formatter = options.formatter;
        this.parser = options.parser;
        this.formatStr = options.formatStr;
        this.listInput = options.listInput;
    },
    render: function() {
        this.formatter && this.$el.attr(
            'title', formsText('formText')(this.formatter.pattern() || this.formatter.value())
        );
        const placeholder = this.formatStr || (this.formatter && this.formatter.pattern());
        console.log('placeholder', placeholder);
        placeholder && this.$el.attr('placeholder', placeholder);
        this.readOnly && this.$el.prop('readonly', true);
        return this;
    },
    selectAll() {
        this.$el.select();
    },
    fillIn: function(value) {
        this.$el.val(value);
        return this;
    },
    change: function() {
        if (this.readOnly) return;

        var returnedResult = this.validate();
        var results = Array.isArray(returnedResult) ? returnedResult : [returnedResult];
        console.log("parse result:", result);
        for (var r = 0; r < results.length; r++) {
            var result = results[r];
            if (_.isUndefined(result)) return;

            this.trigger("changed", result.parsed);
        }
    },
    changing: function() {
        this.readOnly || this.trigger("changing");
    },
    validate: function(deferred) {
        var value = this.$el.val().trim();
        if (this.listInput) {
            return this.validateList(value, deferred);
        } else {
            try {
                return this.validateValue(value, deferred);
            } catch (e) {
                if (Array.isArray(e) && e[0] === this) {
                    this.trigger('addsaveblocker', e[1], e[2], e[3]);
                } else {
                    throw e;
                }
                return undefined;
            }
        }
    },
    validateList: function(value, deferred) {
        var values = value.split(",");
        var results = [];
        /*It might be nice to accept valid listitems and reject invalids?
         For now if the list contains any invalid entries everything is rejected.
         */
        //var errors = [];
        for (var v = 0; v < values.length; v++) {
            try {
                results.push(this.validateValue(values[v].trim(), deferred));
            } catch (e) {
                if (Array.isArray(e) && e[0] === this) {
                    //errors.push(e);
                    this.trigger('addsaveblocker', e[1], e[2], e[3]);
                    return undefined;
                } else {
                    throw e;
                    return undefined;
                }
            }
        }
        return results;
    },
    validateValue: function(value, deferred) {
        if (this.noValidation) {
            return { parsed: value };
        }

        var isRequired = this.$el.is('.specify-required-field');
        if (value === '' && isRequired) {
            throw [this, 'fieldrequired', 'Field is reqired.', deferred];
             return undefined;
        } else {
            this.trigger('removesaveblocker', 'fieldrequired');
        }

        if (this.formatter) {
            var formatterVals = this.formatter.parse(value);
            if (!formatterVals) {
                throw [
                    this,
                    'badformat',
                    'Required format: ' + (this.formatter.pattern() || this.formatter.value()),
                    deferred
                ];
                return undefined;
            } else {
                this.trigger('removesaveblocker', 'badformat');
                value = this.formatter.canonicalize(formatterVals);
            }
        }

        var parseResult = this.parser(value);
        if (!parseResult.isValid) {
            throw [this, 'cantparse', parseResult.reason, deferred];
            return undefined;
        } else {
            this.trigger('removesaveblocker', 'cantparse');
            return parseResult;
        }
    }
});

