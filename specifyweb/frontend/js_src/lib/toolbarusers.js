"use strict";

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');

var schema     = require('./schema.js');
var navigation = require('./navigation.js');
const commonText = require('./localization/common.tsx').default;

    var UsersView = Backbone.View.extend({
        __name__: "UsersView",
        className: "users-view table-list-dialog",
        events: {},
        initialize: function(options) {
            this.users = options.users;
        },
        render: function() {
            var trs = this.users.map(this.makeItem);
            $('<table>').append(trs).appendTo(this.el);
            this.$el.dialog({
                title: commonText('manageUsersDialogTitle'),
                modal: true,
                close: function() { $(this).remove(); },
                buttons: [
                    {text: commonText('new'), click: function() { navigation.go('view/specifyuser/new/'); }},
                    {text: commonText('cancel'), click: function() { $(this).dialog('close'); }}
                ]
            });
            return this;
        },
        makeItem: function(user) {
            var tr = $('<tr>');
            $('<a>', { href: user.viewUrl(), 'class': 'intercept-navigation' })
                .text(user.get('name'))
                .appendTo($('<td>').appendTo(tr));
            return tr[0];
        }
    });

    function execute() {
        const users = new schema.models.SpecifyUser.LazyCollection({
            filters: {orderby: 'name'}
        });
        users.fetch({limit: 0}).done(function() {
            new UsersView({ users: users }).render();
        });
    };

module.exports =  {
        task: 'users',
        title: commonText('manageUsers'),
        icon: null,
        execute: execute,
        disabled: function(user) { return !user.isadmin; }
    };

