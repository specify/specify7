define(['jquery', 'underscore', 'backbone', 'jquery-bbq'], function($, _, Backbone) {
    "use strict";

    var win = $(window);
    var doc = $(document);

    return Backbone.View.extend({
        __name__: "ScrollResults",
        events: {
            'scroll': 'scroll',
            'remove': 'undelegateEvents'
        },
        initialize: function(options) {
            this.ajaxUrl = options.ajaxUrl;
            this.doFetch = options.fetch || this.doFetchSimple.bind(this);
            this.resultsView = options.view;
            this.offset = 0;

            this.container = options.onWindow ? win : this.$el;
            this.content = options.onWindow ? doc : this.resultsView.$el;
        },
        scrolledToBottom: function() {
            return this.container.height() + this.container.scrollTop() + 10 > this.content.height();
        },
        shouldFetchMore: function() {
            var visible = this.$el.is(':visible');
            return !this.fetchedAll && this.scrolledToBottom() && visible && !this.fetch;
        },
        resultsFromData: function(data) {
            var rv = this.resultsView;
            return rv.resultsFromData ? rv.resultsFromData(data) : data;
        },
        detectEndOfResults: function(results) {
            var rv = this.resultsView;
            return rv.detectEndOfResults ? rv.detectEndOfResults(results) : (results.length < 1);
        },
        fetchMore: function() {
            if (this.fetch) return this.fetch;
            this.trigger('fetching', this);
            return this.fetch = this.doFetch(this.offset).done(this.gotData.bind(this));
        },
        doFetchSimple: function(offset) {
            var url = $.param.querystring(this.ajaxUrl, {offset: offset});
            return $.get(url);
        },
        gotData: function(data) {
            var results = this.resultsFromData(data);
            this.fetch = null;
            this.trigger('gotdata', this);
            if (this.detectEndOfResults(results)) {
                this.fetchedAll = true;
                this.trigger('fetchedall', this);
            } else {
                this.offset += this.resultsView.addResults(results);
            }
        },
        fetchMoreWhileAppropriate: function() {
            var _this = this;
            function recur() {
                _this.shouldFetchMore() && _this.fetchMore().done(recur);
            }
            recur();
        },
        render: function() {
            this.$el.data('view', this);
            this.resultsView.render();
            this.options.initialData && this.gotData(this.options.initialData);
            if (this.options.onWindow) {
                this.onScroll = this.scroll.bind(this);
                win.on('scroll', this.onScroll);
            }
            return this;
        },
        scroll: function(evt) {
            this.fetchMoreWhileAppropriate();
        },
        undelegateEvents: function() {
            this.onScroll && win.off('scroll', this.onScroll);
            Backbone.View.prototype.undelegateEvents.apply(this, arguments);
        }
    });
});
