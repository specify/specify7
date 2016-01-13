"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');
var Q        = require('q');

module.exports =  Backbone.View.extend({
        __name__: "CheckBox",
        events: {
            'change': 'change'
        },
        render: function() {
            if (!this.$el.hasClass('specify-ignore-field')) {
                Q(this.model.getResourceAndField(this.$el.attr('name')))
                    .spread(this._render.bind(this))
                    .done();
            }
            return this;
        },
        _render: function(resource, field) {
            if (!field) {
                console.error('unknown field', this.$el.attr('name'), 'in', this.model);
                return;
            }

            field.readOnly && this.$el.prop('disabled', true);

            var fieldName = field.name.toLowerCase();

            var $el = this.$el;
            var set = function() {
                $el.prop('checked', resource.get(fieldName));
            };

            set();
            resource.on('change:' + fieldName, set);
        },
        change: function() {
            if (!this.$el.hasClass('specify-ignore-field')) {
                this.model.set(this.$el.attr('name'), this.$el.prop('checked'));
            }
        }
    });

