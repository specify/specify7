define(['jquery', 'underscore', 'backbone', 'jquery-bbq'], function($, _, Backbone) {
    "use strict";

    var win = $(window);
    var doc = $(document);

    return Backbone.View.extend({
        __name__: "ScrollResults",
        events: {
            'scroll': 'scroll'
        },
        initialize: function(options) {
            this.ajaxUrl = options.ajaxUrl;
            this.resultsView = new options.View(_.extend({el: this.el}, options.viewOptions));
            this.offset = 0;

            this.scrolledToBottom = this.resultsView.getContentEl ? function() {
                return this.resultsView.getContentEl().height() - this.$el.scrollTop() - this.$el.height() < 1;
            } : function() {
                return win.scrollTop() + win.height() + 100 > doc.height();
            };

            if (!this.resultsView.getContentEl) {
                win.scroll(_.bind(this.scroll, this));
            }
        },
        shouldFetchMore: function() {
            var visible = this.$el.is(':visible');
            var scrolledToBottom = this.scrolledToBottom();
            return !this.fetchedAll && scrolledToBottom && visible && !this.fetch;
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
            var url = $.param.querystring(this.ajaxUrl, {offset: this.offset});
            this.trigger('fetching', this);
            return this.fetch = $.get(url, _.bind(this.gotData, this));
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
            return this;
        },
        scroll: function(evt) {
            this.fetchMoreWhileAppropriate();
        }
    });
});
