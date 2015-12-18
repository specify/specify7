"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');


module.exports =  Backbone.View.extend({
        __name__: "UIFieldInput",
        events: {
            'change': 'change',
            'input': 'changing'
        },
        initialize: function(options) {
            this.readOnly = options.readOnly;
            this.noValidation = options.noValidation;
            this.formatter = options.formatter;
            this.parser = options.parser;
        },
        render: function() {
            this.formatter && this.$el.attr('title', 'Format: ' + this.formatter.value());
            this.$el.attr('placeholder', this.parser.formatStr);
            this.readOnly && this.$el.prop('readonly', true);
            return this;
        },
        fillIn: function(value) {
            this.$el.val(value);
            return this;
        },
        change: function() {
            if (this.readOnly) return;
            var result = this.validate();
            console.log("parse result:", result);
            if (_.isUndefined(result)) return;

            this.trigger("changed", result.parsed);
        },
        changing: function() {
            this.readOnly || this.trigger("changing");
        },
        validate: function(deferred) {
            var value = this.$el.val().trim();
            if (this.noValidation) {
                return { parsed: value };
            }

            var isRequired = this.$el.is('.specify-required-field');
            if (value === '' && isRequired) {
                this.trigger('addsaveblocker', 'fieldrequired', "Field is required.", deferred);
                return undefined;
            } else {
                this.trigger('removesaveblocker', 'fieldrequired');
            }

            if (this.formatter) {
                var formatterVals = this.formatter.parse(value);
                if (!formatterVals) {
                    this.trigger('addsaveblocker', 'badformat', "Required format: " + this.formatter.value(), deferred);
                    return undefined;
                } else {
                    this.trigger('removesaveblocker', 'badformat');
                    value = this.formatter.canonicalize(formatterVals);
                }
            }

            var parseResult = this.parser(value);
            if (!parseResult.isValid) {
                this.trigger('addsaveblocker', 'cantparse', parseResult.reason, deferred);
                return undefined;
            } else {
                this.trigger('removesaveblocker', 'cantparse');
                return parseResult;
            }
        }
    });

