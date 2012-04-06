define(['jquery', 'underscore', 'backbone', 'jquery-ui'], function($, _, Backbone) {
    var debug = true;
    var emptyTemplate = '<p>nothing here...</p>';
    var spinnerTemplate = '<div style="text-align: center"><img src="/static/img/icons/specify128spinner.gif"></div>';

    return Backbone.View.extend({
        render: function() {
            var self = this;
            this.$el.empty();
            this.noContent = $(emptyTemplate).appendTo(this.el);
            this.content = $('<div>').appendTo(this.el);
            this.spinner = $(spinnerTemplate).appendTo(this.el);
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
                slide: function(event, ui) {
                    $('.ui-slider-handle', this).text(ui.value + 1);
                    if (_(self.collection.at(ui.value)).isUndefined()) {
                        if (!self.spinner.is(':hidden')) return;
                        var height = Math.min(128, self.content.height());
                        self.spinner.height(height);
                        self.spinner.find('img').height(0.9*height);
                        self.content.hide();
                        self.spinner.show();
                        showingSpinner = true;
                    } else _.defer(_.bind(self.redraw, self, ui.value));
                }
            });
            this.slider.find('.ui-slider-handle').
                css({'min-width': '1.2em', width: 'auto', 'text-align': 'center', padding: '0 3px 0 3px'}).
                text(1);
            self.redraw(0);
            self.showHide();
        },
        showHide: function() {
            switch (this.collection.length) {
            case 0:
                this.noContent.show();
                this.content.hide();
                this.spinner.hide();
                this.slider.hide();
                break;
            case 1:
                this.noContent.hide();
                this.content.show();
                this.spinner.hide();
                this.slider.hide();
                break;
            default:
                this.noContent.hide();
                this.content.show();
                this.spinner.hide();
                this.slider.show();
                break;
            }
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
                    self.spinner.hide();
                    self.content.show();
                } else {
                    debug && console.log('not filling because slider is at ' +
                                         curOffset + ' but data is for ' + offset);
                }
            });
        }
    });
});
