"use strict";

var $        = require('jquery');
var Backbone = require('./backbone.js');

module.exports =  Backbone.View.extend({
        __name__: "UserTypeCBX",
        events: {
            change: 'set'
        },
        initialize: function(info) {
            this.resource = info.resource;
            this.field = info.field.name.toLowerCase();
            this.resource.on('change:' + this.field, this.render, this);
        },
        getUserTypes: function() {
            return ["Manager", "FullAccess", "LimitedAccess", "Guest"];
        },
        render: function() {
            var options = this.getUserTypes().map(function(type) {
                return $('<option>').attr('value', type).text(type)[0];
            });
            this.$el.empty().append(options);
            this.$el.val(this.resource.get(this.field));
            this.set();
            return this;
        },
        set: function(event) {
            this.resource.set(this.field, this.$el.val());
        }
    });

