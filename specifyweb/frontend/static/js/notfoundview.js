"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

module.exports = Backbone.View.extend({
        __name__: "NotFoundView",
        render: function() {
            var self = this;
            self.$el.empty();
            self.$el.append("<h3>Page Not Found</h3");
        }
    });

