define([
    'require', 'jquery', 'underscore', 'backbone', 'navigation', 'jquery-bbq',
    'toolbarwelcome', 'toolbardataentry', 'toolbarquery'
], function headerUI(require, $, _, Backbone, navigation, jquery_bbq) {
    "use strict";

    var toolModules = _.tail(arguments, headerUI.length);

    var ExpressSearchInput = Backbone.View.extend({
        events: {
            'submit': 'search'
        },
        el: $('<form id="express-search" action="/specify/express_search/">'),
        render: function() {
            this.$el.append('<input type="text" class="express-search-query" name="q" placeholder="Search">');
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
        events: {
            'click #site-nav > ul > li > a': 'siteNavClick'
        },
        el: $('#site-header'),
        render: function() {
            (new ExpressSearchInput()).render().$el.appendTo(this.el);
            this.$('#header-loading').remove();
            this.$el.append('<nav id="site-nav">');
            var ul = $('<ul>');
            _(toolModules).each(function(toolDef) {
                $('<a>')
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
        }
    });
});