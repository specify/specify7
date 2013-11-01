define([
    'require', 'jquery', 'underscore', 'backbone', 'navigation', 'cs!domain', 'templates',
    'jquery-bbq', 'jquery-ui',
    'toolbarwelcome', 'toolbardataentry', 'toolbarquery', 'toolbarattachments'
], function headerUI(
    require, $, _, Backbone, navigation, domain, templates,
    jquery_bbq, jquery_ui
) {
    "use strict";

    var toolModules = _.tail(arguments, headerUI.length);

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
            'click .username': 'openUserTools'
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
            domain.levels.collection.fetchIfNotPopulated().done(function (collection) {
                _this.$('#user-tools').prepend(
                    $('<a>', {'class': 'username'}).text(_this.user.name), ' | ',
                    collection.get('collectionname'), ' | ');
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
        }
    });
});
