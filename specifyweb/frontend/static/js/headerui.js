define([
    'require', 'jquery', 'underscore', 'backbone', 'navigation', 'domain', 'schema', 'usertools',
    'jquery-bbq', 'jquery-ui',
// Tasks included in header:
    'toolbarwelcome',
    'toolbardataentry',
    'toolbartrees',
    'toolbarrecordsets',
    'toolbarquery',
    'toolbarreport',
    'toolbarattachments',
    'toolbarmasterkey',
    'toolbarusers'
], function headerUI(
    require, $, _, Backbone, navigation, domain, schema, UserTools,
    jquery_bbq, jquery_ui
) {
    "use strict";
    var toolModules = _(arguments).tail(headerUI.length);

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

            this.toolModules = toolModules.filter(function(mod){
                return !(_.isFunction(mod.disabled) ? mod.disabled(app.user) : mod.disabled);
            });

            this.visibleTools = this.toolModules.filter(function(t) { return t.icon != null; });
            this.hiddenTools = this.toolModules.filter(function(t) { return t.icon == null; });

            _.each(this.toolModules, function(module) {
                app.router.route('task/' + module.task + '/', 'startTask', module.execute.bind(module));
            });
        },
        render: function() {
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
            var lis = this.visibleTools.map(this.makeButton);
            $('<ul>').append(lis).appendTo(this.$('#site-nav'));
            return this;
        },
        makeButton: function(toolDef) {
            var li = $('<li>');
            $('<a>', { href: '/specify/task/' + toolDef.task + '/' })
                .text(toolDef.title)
                .prepend($('<img>', {src: toolDef.icon}))
                .appendTo(li);
            return li[0];
        },
        siteNavClick: function(evt) {
            evt.preventDefault();
            var index = this.$('#site-nav > ul > li > a').index(evt.currentTarget);
            this.visibleTools[index].execute();
        },
        openUserTools: function(evt) {
            new UserTools({user: this.user, tools: this.hiddenTools}).render();
        },
        changeCollection: function(evt) {
            navigation.switchCollection(parseInt(this.$('#user-tools select').val()), '/');
        }
    });
});
