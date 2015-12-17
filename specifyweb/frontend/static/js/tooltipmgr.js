"use strict";

var $ = require('jquery');
var _ = require('underscore');

    function ToolTipMgr(view, control) {
        this.view = view;
        this.generators = [];
        this.control = control && $(control) || this.view.$el;
        this.view.on('tooltipitem', this.addToolTipItem, this);
    }

    _.extend(ToolTipMgr.prototype, {
        addToolTipItem: function(item) {
            this.el.find('.tooltip-content').append($('<li>').text(item));
            return this.el.show().position({
                at: 'bottom center+10',
                of: this.control,
                my: 'top'
            });
        },
        enable: function() {
            var view = this.view;
            var el = this.el = $('<div class="tooltip">\n' +
                                 '    <div class="tooltip-arrow">▲</div>\n' +
                                 '    <ul class="tooltip-content"></ul>\n' +
                                 '</div>').insertAfter(this.control);

            this.control.hover(function() {
                el.find('.tooltip-content').empty();
                view.trigger('requestfortooltips');
            });
            this.control.mouseleave(function() {
                el.hide();
            });
            return this;
        }
    });

module.exports =  ToolTipMgr;
