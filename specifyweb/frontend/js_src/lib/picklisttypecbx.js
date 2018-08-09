"use strict";

var $        = require('jquery');
var Backbone = require('./backbone.js');

module.exports =  Backbone.View.extend({
        __name__: "PickListTypeCBX",
        events: {
            change: 'set'
        },
        initialize: function(info) {
            this.resource = info.resource;
            this.field = 'type';
            this.resource.on('change:type', this.render, this);
        },
        getPickListTypes: function() {
            return ['User Defined Items', 'Entire Table', 'Field From Table'];
        },
        render: function() {
            var options = this.getPickListTypes().map(function(type, i) {
                return $('<option>').attr('value', i).text(type)[0];
            });
            this.$el.empty().append(options);
            this.$el.val(this.resource.get('type'));
            this.set();
            return this;
        },
        set: function(event) {
            var val = parseInt(this.$el.val(), 10);
            this.resource.set('type', val);
        }
    });

