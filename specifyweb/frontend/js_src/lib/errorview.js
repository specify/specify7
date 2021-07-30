"use strict";

import $ from 'jquery';
import Backbone from './backbone';
import * as navigation from './navigation';
import commonText from './localization/common';

        export const ErrorView = Backbone.View.extend({
            __name__: "ErrorView",
            render: function() {
                var request = this.options.request;
                this.$el.empty();
                this.$el.append("<h3>" + request.status +"</h3");
                this.$el.append("<p>" + request.statusText + "</p>");
            }
        });

        export const UnhandledErrorView =Backbone.View.extend({
            __name__: "UnhandledErrorView",
            render: function() {
                this.$el.attr('title', commonText('backEndErrorDialogTitle'))
                    .append(commonText('backEndErrorDialogHeader'))
                    .append(`<p>${commonText('backEndErrorDialogMessage')}</p>`);
                var response = this.options.jqxhr.responseText;
                if (/^Traceback:/m.test(response)) {
                    this.$el.append($('<textarea readonly>').val(response).css({'width': '100%', 'min-height': 600}));
                }
                this.$el.dialog({
                    modal: true,
                    width: '800',
                    dialogClass: 'ui-dialog-no-close',
                    buttons: [
                        {text:  commonText('close'), click: function() { window.location = "/"; }},
                    ]
                });
                navigation.clearUnloadProtect();
            }
        });
