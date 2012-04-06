define(['jquery', 'underscore', 'backbone', 'jquery-ui'], function($, _, Backbone) {
    var debug = false;
    var emptyTemplate = '<p>nothing here...</p>';
    var spinnerTemplate = '<div style="text-align: center"><img src="/static/img/icons/specify128spinner.gif"></div>';

    return Backbone.View.extend({
        initialize: function(options) {
            var self = this;
            self.collection.on('add', function() {
                var end = self.collection.length - 1;
                self.slider.slider('option', { max: end, value: end });
                self.onSlide(end);
                self.showHide();
            });
        },
        render: function() {
            var self = this;
            this.$el.empty();
            this.noContent = $(emptyTemplate).appendTo(this.el);
            this.content = $('<div>').appendTo(this.el);
            this.spinner = $(spinnerTemplate).appendTo(this.el).hide();
            this.slider = $('<div>').appendTo(this.el).slider({
                max: self.collection.length - 1,
                stop: _.throttle(function(event, ui) {
                    if (self.collection.at(ui.value)) return;
                    self.request && self.request.abort();
                    var at = ui.value - ui.value % self.collection.limit;
                    self.request = self.collection.fetch({at: at}).done(function() {
                        debug && console.log('got collection at offset ' + at);
                        request = null;
                        self.redraw(self.slider.slider('value'));
                    });
                }, 750),
                slide: function(event, ui) { self.onSlide(ui.value); }
            });
            this.slider.find('.ui-slider-handle').
                css({'min-width': '1.2em', width: 'auto', 'text-align': 'center', padding: '0 3px 0 3px'}).
                text(1);
            self.redraw(0);
            self.showHide();
        },
        onSlide: function(offset) {
            this.$('.ui-slider-handle').text(offset + 1);
            if (_(this.collection.at(offset)).isUndefined()) this.showSpinner();
            else _.defer(_.bind(this.redraw, this, offset));
        },
        redraw: function(offset) {
            var self = this;
            debug && console.log('want to redraw at ' + offset);
            var resource = this.collection.at(offset);
            if (_(resource).isUndefined()) return;
            this.options.buildContent(resource).done(function(content) {
                var curOffset = self.slider.slider('value');
                if (curOffset === offset) {
                    debug && console.log('filling in at ' + offset);
                    self.content.empty().append(content);
                    self.hideSpinner();
                } else {
                    debug && console.log('not filling because slider is at ' +
                                         curOffset + ' but data is for ' + offset);
                }
            });
        },
        showSpinner: function() {
            if (!this.spinner.is(':hidden')) return;
            var height = Math.min(128, this.content.height());
            this.spinner.height(height);
            this.spinner.find('img').height(0.9*height);
            this.content.hide();
            this.spinner.show();
        },
        hideSpinner: function() {
            this.spinner.hide();
            this.content.show();
        },
        showHide: function() {
            switch (this.collection.length) {
            case 0:
                this.noContent.show();
                this.content.hide();
                this.slider.hide();
                break;
            case 1:
                this.noContent.hide();
                this.content.show();
                this.slider.hide();
                break;
            default:
                this.noContent.hide();
                this.content.show();
                this.slider.show();
                break;
            }
        }
    });
});
