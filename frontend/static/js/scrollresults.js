define(['jquery', 'underscore', 'backbone'], function($, _, Backbone) {
    "use strict";

    return Backbone.View.extend({
        events: {
            'scroll': 'scroll'
        },
        initialize: function(options) {
            this.ajaxUrl = options.ajaxUrl;
            this.resultsView = new options.View(_.extend({el: this.el}, options.viewOptions));
        },
        shouldFetchMore: function() {
            var visible = this.$el.is(':visible');
            var scrolledToBottom = this.$('table').height() - this.$el.scrollTop() - this.$el.height() < 1;
            return !this.fetchedAll && scrolledToBottom && visible && !this.fetch;
        },
        fetchMore: function() {
            if (this.fetch) return this.fetch;
            var url = $.param.querystring(this.ajaxUrl, {last_id: this.resultsView.getLastID()});
            var _this = this;
            return this.fetch = $.get(url, function(data) {
                _this.fetch = null;
                var results = _this.resultsView.resultsFromData(data);
                if (results.length < 1) {
                    _this.fetchedAll = true;
                } else {
                    _this.resultsView.addResults(results);
                }
            });
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
            return this;
        },
        scroll: function(evt) {
            this.fetchMoreWhileAppropriate();
        }
    });
});