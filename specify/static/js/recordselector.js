define([
    'require', 'jquery', 'underscore', 'backbone', 'specifyform', 'populateform', 'navigation', 'templates',
    'jquery-ui'
], function(require, $, _, Backbone, specifyform, populateform, navigation, templates) {
    var debug = false;
    var emptyTemplate = '<p>nothing here...</p>';
    var spinnerTemplate = '<div style="text-align: center"><img src="/static/img/icons/specify128spinner.gif"></div>';

    return Backbone.View.extend({
        events: {
            'click .specify-subview-header .specify-delete-related' : 'openDeleteDialog',
            'click .specify-subview-header .specify-add-related' : 'add'
        },
        initialize: function(options) {
            var self = this;
            self.collection.on('add', function() {
                var end = self.collection.length - 1;
                self.slider.slider('option', { max: end, value: end });
                self.onSlide(end);
                self.showHide();
            });
            self.collection.on('destroy', function() {
                var end = self.collection.length - 1;
                var value = Math.min(self.slider.slider('value'), end);
                self.slider.slider('option', { max: end, value: value });
                self.onSlide(value);
                self.showHide();
            });
            self.resource = options.resource;
            self.specifyModel = options.resource.specifyModel;
            self.fieldName = options.fieldName;
            self.title = self.specifyModel.getField(self.fieldName).getLocalizedName();
        },
        fetchThenRedraw: function(offset) {
            var self = this;
            if (self.collection.at(offset)) return null;
            self.request && self.request.abort();
            var at = offset - offset % self.collection.limit;
            self.request = self.collection.fetch({at: at}).done(function() {
                debug && console.log('got collection at offset ' + at);
                request = null;
                self.redraw(self.slider.slider('value'));
            });
            return self.request;
        },
        render: function() {
            var self = this;
            self.undelegateEvents();
            self.$el.empty();
            self.slider = $('<div>');
            self.$el.hasClass('no-header') || self.$el.append(templates.subviewheader());
            self.$el.hasClass('slider-at-top') && self.$el.append(self.slider);
            self.$('.specify-subview-title').text(self.title);
            self.noContent = $(emptyTemplate).appendTo(self.el);
            self.content = $('<div>').appendTo(self.el);
            self.spinner = $(spinnerTemplate).appendTo(self.el).hide();
            self.$el.hasClass('slider-at-top') || self.$el.append(self.slider);
            self.slider.slider({
                max: self.collection.length - 1,
                stop: _.throttle(function(event, ui) { self.fetchThenRedraw(ui.value); }, 750),
                slide: function(event, ui) { self.onSlide(ui.value); }
            });
            self.slider.find('.ui-slider-handle').
                css({'min-width': '1.2em', width: 'auto', 'text-align': 'center', padding: '0 3px 0 3px'}).
                text(1);
            self.deleteDialog = $(templates.confirmdelete()).appendTo(self.el).dialog({
                resizable: false, modal: true, autoOpen: false, buttons: {
                    'Delete': _.bind(self.destroy, self),
                    'Cancel': function() { $(this).dialog('close'); }
                }
            });
            self.deleteDialog.parent('.ui-dialog').appendTo(self.el);
            self.deleteDialog.on('remove', function() {
                $(this).detach();
            });
            self.delegateEvents();
            self.urlParam = self.$el.data('url-param');
            var params = $.deparam.querystring(true);
            var index = params[self.urlParam] || 0;
            self.slider.slider('value', index);
            self.fetchThenRedraw(index) || self.redraw(index);
            self.showHide();
        },
        onSlide: function(offset) {
            $('.ui-slider-handle', this.slider).text(offset + 1);
            if (_(this.collection.at(offset)).isUndefined()) this.showSpinner();
            else _.defer(_.bind(this.redraw, this, offset));
        },
        redraw: function(offset) {
            var self = this;
            debug && console.log('want to redraw at ' + offset);
            var resource = self.collection.at(offset);
            if (_(resource).isUndefined()) return;
            var form = specifyform.buildSubView(self.$el);
            require('populateform')(form, resource);
            debug && console.log('filling in at ' + offset);
            self.content.empty().append(form);
            self.hideSpinner();
            if (self.urlParam) {
                var params = {};
                params[self.urlParam] = offset;
                navigation.push($.param.querystring(window.location.pathname, params));
            }
            $('.ui-slider-handle', this.slider).text(offset + 1);
        },
        showSpinner: function() {
            if (!this.spinner.is(':hidden')) return;
            var height = Math.min(64, this.content.height());
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
            this.spinner.hide();
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
        },
        openDeleteDialog: function(evt) {
            evt.preventDefault();
            this.deleteDialog.dialog('open');
        },
        destroy: function() {
            this.deleteDialog.dialog('close');
            return this.collection.at(this.slider.slider('value')).destroy();
        },
        add: function() {
            var newResource = new (this.collection.model)();
            var osn = this.specifyModel.getField(this.fieldName).otherSideName;
            newResource.set(osn, this.resource.url());
            this.collection.add(newResource);
        }
    });
});
