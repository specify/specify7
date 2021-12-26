"use strict";

var $                = require('jquery');
var Backbone         = require('./backbone.js');
const navigation = require('./navigation.js');
const commonText = require('./localization/common').default;

module.exports = {

        ErrorView: Backbone.View.extend({
            __name__: "ErrorView",
            render: function() {
                var request = this.options.request;
                this.$el.html(`
                    <h2>${request.status}</h2>
                    <p>${request.statusText}</p>
                `);
            }
        }),

        UnhandledErrorView: Backbone.View.extend({
            __name__: "UnhandledErrorView",
            render: function() {
                this.$el.append(`
                    ${commonText('backEndErrorDialogHeader')}
                    <p>${commonText('backEndErrorDialogMessage')}</p>
                `);
                this.$el.append($('<textarea readonly>')
                    .val(this.options.response)
                    .css({'width': '100%', 'min-height': 600}));
                this.el.setAttribute('role','alert');
                this.$el.dialog({
                    modal: true,
                    width: '800',
                    title: commonText('backEndErrorDialogTitle'),
                    dialogClass: 'ui-dialog-no-close',
                    buttons: [
                        {text:  commonText('close'), click: function() { window.location = "/"; }},
                    ]
                });
                navigation.clearUnloadProtect();
            }
        })
    };
