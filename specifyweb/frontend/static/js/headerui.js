define([
    'require', 'jquery', 'underscore', 'backbone', 'navigation', 'domain', 'templates', 'schema',
    'jquery-bbq', 'jquery-ui',
// Tasks included in header:
    'toolbarwelcome',
    'toolbardataentry',
    'toolbartrees',
    'toolbarrecordsets',
    'toolbarquery',
    'toolbarreport',
    'toolbarattachments'
], function headerUI(
    require, $, _, Backbone, navigation, domain, templates, schema,
    jquery_bbq, jquery_ui
) {
    "use strict";

    var toolModules = _.chain(arguments).tail(headerUI.length).filter(function(mod){ return !mod.disabled; }).value();

    var ExpressSearchInput = Backbone.View.extend({
        __name__: "ExpressSearchInput",
        events: {
            'submit': 'search'
        },
        el: $('<form id="express-search" action="/specify/express_search/">'),
        render: function() {
            this.$el.append('<input type="search" class="express-search-query" name="q" placeholder="Search">');
            return this;
        },
        search: function(evt) {
            var query, url;
            evt.preventDefault();
            query = this.$('.express-search-query').val().trim();
            if (query) {
                url = $.param.querystring('/specify/express_search/', {q: query});
                navigation.go(url);
            }
        }
    });


    return Backbone.View.extend({
        __name__: "HeaderUI",
        events: {
            'click #site-nav > ul > li > a': 'siteNavClick',
            'click .username': 'openUserTools',
            'change #user-tools select': 'changeCollection'
        },
        el: $('#site-header'),
        initialize: function() {
            var app = require('specifyapp');
            this.user = app.user;

            _.each(toolModules, function(module) {
                app.router.route('task/' + module.task + '/', 'startTask', module.execute.bind(module));
            });
        },
        render: function() {
            var _this = this;
            (new ExpressSearchInput()).render().$el.appendTo(this.el);
            this.user.isauthenticated && this.$('#user-tools a.username').text(this.user.name);
            this.$('#user-tools a.login-logout')
                .text(this.user.isauthenticated ? '✕' : 'Log in')
                .attr('href', '/accounts/' + (this.user.isauthenticated ? 'logout/' : 'login/'))
                .attr('title', this.user.isauthenticated ? 'Log out.' : 'Log in.');

            var collectionSelector = this.$('#user-tools select');
            var collections = new schema.models.Collection.LazyCollection();
            $.when(
                domain.levels.collection.fetchIfNotPopulated(),
                collections.fetch({limit: 0})
            ).done(function (currentCollection) {
               collections.each(function(collection) {
                   $("<option>", {selected: collection.id === currentCollection.id, value: collection.id})
                       .text(collection.get('collectionname'))
                       .appendTo(collectionSelector);
               });
            });
            this.$('#header-loading').remove();
            this.$el.append('<nav id="site-nav">');
            var ul = $('<ul>');
            _(toolModules).each(function(toolDef) {
                $('<a>', { href: '/specify/task/' + toolDef.task + '/' })
                    .text(toolDef.title)
                    .prepend($('<img>', {src: toolDef.icon}))
                    .appendTo($('<li>').appendTo(ul));
            });
            this.$('#site-nav').append(ul);
            return this;
        },
        siteNavClick: function(evt) {
            evt.preventDefault();
            var index = this.$('#site-nav > ul > li > a').index(evt.currentTarget);
            toolModules[index].execute();
        },
        openUserTools: function(evt) {
            $(templates.usertools({user: this.user}))
                .appendTo(this.el)
                .dialog({
                    modal: true,
                    buttons: [
                        {text: 'Cancel', click: function() { $(this).dialog('close'); }}
                    ]
                });
        },
        changeCollection: function(evt) {
            navigation.switchCollection(parseInt(this.$('#user-tools select').val()), '/');
        }
    });
});
