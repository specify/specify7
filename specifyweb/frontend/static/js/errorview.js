define([
    'jquery', 'underscore', 'backbone'
], function($, _, Backbone) {
    "use strict";

    return {

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
                    .append('<p>An unexpected error has occured during communication with the server.</p>')
                    .append($('<textarea readonly>').val(this.options.jqxhr.responseText).css({'min-width': 800, 'min-height': 600}))
                    .appendTo($('body'))
                    .dialog({
                        modal: true,
                        width: 'auto',
                        open: function(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); },
                        buttons: [{text: 'Reload', click: function() { window.location.reload(); }},
                                  {text: 'Previous Page', click: function() { window.history.back(); }}]
                    });
            }
        })
    };
});
