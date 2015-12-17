"use strict";

var $                = require('jquery');
var _                = require('underscore');
var Backbone         = require('./backbone.js');

module.exports = {

        ErrorView: Backbone.View.extend({
            __name__: "ErrorView",
            render: function() {
                var request = this.options.request;
                this.$el.empty();
                this.$el.append("<h3>" + request.status +"</h3");
                this.$el.append("<p>" + request.statusText + "</p>");
            }
        }),

        UnhandledErrorView: Backbone.View.extend({
            __name__: "UnhandledErrorView",
            render: function() {
                this.$el.attr('title', 'Unexpected Error')
                    .append('<p>An unexpected error has occured during communication with the server.</p>');
                var response = this.options.jqxhr.responseText;
                if (/^Exception at/.test(response)) {
                    this.$el.append($('<textarea readonly>').val(response).css({'min-width': 800, 'min-height': 600}));
                }
                this.$el.dialog({
                    modal: true,
                    width: 'auto',
                    open: function(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); },
                    buttons: [{text: 'Reload', click: function() { window.location.reload(); }},
                              {text: 'Previous Page', click: function() { window.history.back(); }}]
                });
            }
        })
    };
