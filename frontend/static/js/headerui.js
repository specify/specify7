define([
    'require', 'jquery', 'underscore', 'backbone', 'navigation', 'jquery-bbq'
], function(require, $, _, Backbone, navigation) {
    "use strict";

    var toolModules = ['toolbarwelcome', 'toolbardataentry', 'toolbarquery'];

    var ExpressSearchInput = Backbone.View.extend({
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
        events: {
            'click #site-nav > ul > li > a': 'siteNavClick'
        },
        el: $('#site-header'),
        render: function() {
            var _this = this;
            (new ExpressSearchInput()).render().$el.appendTo(_this.el);
            require(toolModules, function() {
                _this.$('#header-loading').remove();
                _this.$el.append('<nav id="site-nav">');
                var ul = $('<ul>');
                _(arguments).each(function(toolDef) {
                    $('<a>')
                        .text(toolDef.title)
                        .prepend($('<img>', {src: toolDef.icon}))
                        .appendTo($('<li>').appendTo(ul));
                });
                _this.$('#site-nav').append(ul);
                _this.modules = _(arguments).toArray();
            });
            return _this;
        },
        siteNavClick: function(evt) {
            evt.preventDefault();
            var index = this.$('#site-nav > ul > li > a').index(evt.currentTarget);
            this.modules[index].execute();
        }
    });
});