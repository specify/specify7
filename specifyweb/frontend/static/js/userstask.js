define([
    'jquery', 'underscore', 'backbone', 'specifyapi', 'schema',
    'domain', 'remoteprefs', 'notfoundview', 'recordselector',
    'navigation', 'jquery-ui'
], function($, _, Backbone, api, schema, domain, remoteprefs,
            NotFoundView, RecordSelector, navigation) {
    "use strict";
    var title = 'Manage Users';

    var UsersView = Backbone.View.extend({
        __name__: "UsersView",
        className: "users-view",
        events: {},
        render: function() {
            $('<h1>').text(title).appendTo(this.el);
            return this;
        }
    });

    return function(app) {
        app.setTitle(title);

        app.router.route('manage_users/', 'users', function() {
            var users = new schema.Specifyuser.LazyCollection();
            users.fetch({limit: 0}).done(function(users) {
                app.setCurrentView(new UsersView({ collection: users }));
            });
        });
    };
});
