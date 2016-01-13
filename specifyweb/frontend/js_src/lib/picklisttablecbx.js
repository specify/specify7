"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var schema = require('./schema.js');

module.exports =  Backbone.View.extend({
        __name__: "PickListTableCBX",
        events: {
            change: 'set'
        },
        initialize: function(info) {
            this.resource = info.resource;
            this.resource.on('change:tablename change:type', this.render, this);
        },
        getPickListTables: function() {
            if (this.resource.get('type') === 0) return [];

            return _.map(schema.models, function(model) {
                return { value: model.name, title: model.getLocalizedName() };
            });
        },
        render: function() {
            var options = this.getPickListTables().map(function(item) {
                return $('<option>').attr('value', item.value).text(item.title)[0];
            });
            this.$el.empty().append(options).prop('disabled', options.length < 1);
            this.$el.val(this.resource.get('tablename'));
            this.set();
            return this;
        },
        set: function(event) {
            this.resource.set('tablename', this.$el.val());
        }
    });

