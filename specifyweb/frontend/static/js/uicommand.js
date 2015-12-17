"use strict";

var Backbone = require('./backbone.js');

var specifyform = require('./specifyform.js');

module.exports =  Backbone.View.extend({
        __name__: "UICommand",
        initialize: function(options) {
            this.init = specifyform.parseSpecifyProperties(this.$el.data('specify-initialize'));
        }
    });
