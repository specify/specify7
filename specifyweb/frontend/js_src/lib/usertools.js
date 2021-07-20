"use strict";

var $                = require('jquery');
var _                = require('underscore');
var Backbone         = require('./backbone.js');
const commonText = require('./localization/common').default;


module.exports = Backbone.View.extend({
        __name__: "UserTools",
        tagName: 'nav',
        className: "table-list-dialog",
        events: {
            'click .user-tool': 'clicked'
        },
        initialize: function(options) {
            this.user = options.user;
            this.tools = options.tools;
        },
        render: function() {
            var table = $('<table>').appendTo(this.el);
            table.append(`<tr><td><a href="/accounts/logout/">${commonText('logOut')}</a></td></tr>`);
            table.append(`<tr><td><a href="/accounts/password_change/">${commonText('changePassword')}</a></td></tr>`);
            table.append(this.tools.map(this.makeItem));

            this.$el.dialog({
                modal: true,
                title: commonText('userToolsDialogTitle'),
                close: function() { $(this).remove(); },
                buttons: [
                    {text: commonText('cancel'), click: function() { $(this).dialog('close'); }}
                ]
            });
            return this;
        },
        makeItem: function(toolDef) {
            var tr = $('<tr>');
            $('<a>', { href: '/specify/task/' + toolDef.task + '/', 'class': 'user-tool' })
                .text(toolDef.title)
                .appendTo($('<td>').appendTo(tr));
            return tr[0];
        },
        clicked: function(event) {
            event.preventDefault();
            this.$el.dialog('close');

            var index = this.$('.user-tool').index(event.currentTarget);
            this.tools[index].execute();
        }
    });

