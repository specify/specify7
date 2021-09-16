"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');
const commonText = require('./localization/common').default;

module.exports = Backbone.View.extend({
        __name__: "NotFoundView",
        render: function() {
            var self = this;
            self.$el.empty();
            self.$el.append(`<h3>${commonText('pageNotFound')}</h3`);
        }
    });

