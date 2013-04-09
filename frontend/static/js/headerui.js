define([
    'require', 'jquery', 'underscore', 'backbone', 'navigation', 'express-search', 'jquery-ui'
], function(require, $, _, Backbone, navigation, esearch) {
    "use strict";

    var toolModules = ['toolbarwelcome', 'toolbardataentry', 'toolbarquery'];

    return Backbone.View.extend({
        events: {
            'click #site-nav > ul > li > a': 'siteNavClick'
        },
        el: $('#site-header'),
        render: function() {
            var _this = this;
            (new esearch.SearchView()).render().$el.appendTo(_this.el);
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