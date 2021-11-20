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
            this.el.innerHTML = `<ul style="padding: 0">
                ${this.tools.map(this.makeItem).join('')}
                ${this.makeItem({
                    task:'/accounts/logout',
                    title: commonText('logOut')
                },'')}
                ${this.makeItem({
                    task:'/accounts/password_change',
                    title: commonText('changePassword')
                },'')}
            </ul>`;

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
        makeItem: (toolDef, defaultPath='/specify/task/') =>
            `<li>
                <a
                    href="${defaultPath}${toolDef.task}/"
                    class="user-tool fake-link"
                    style="font-size: 0.8rem"
                    data-task="${toolDef.task}"
                >${toolDef.title}</a>
            </li>`,
        clicked: function(event) {
            this.$el.dialog('close');

            const taskName = event.target.getAttribute('data-task');
            const task = this.tools.find(({task})=>task===taskName);

            if(typeof task === 'undefined')
              return;

            event.preventDefault();
            task.execute();
        }
    });
