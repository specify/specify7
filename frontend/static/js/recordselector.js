define([
    'jquery', 'underscore', 'backbone', 'specifyform', 'navigation', 'templates', 'jquery-ui'
], function($, _, Backbone, specifyform, navigation, templates) {
    "use strict";
    var debug = false;
    var emptyTemplate = '<p>nothing here...</p>';
    var spinnerTemplate = '<div style="text-align: center"><img src="/static/img/specify128spinner.gif"></div>';

    var BLOCK_SIZE = 20;

    var Controls = Backbone.View.extend({
        initialize: function(options) {
            this.recordSelector = options.recordSelector;
            Backbone.View.prototype.initialize.call(this, options);
        },
        events: {
            'click .specify-add-related': function (evt) {
                evt.preventDefault();
                this.recordSelector.add();
            },
            'click .specify-delete-related': function (evt) {
                evt.preventDefault();
                this.recordSelector.delete();
            },
            'click .specify-visit-related': function (evt) {
                evt.preventDefault();
                this.recordSelector.visit();
            }
        }
    });

    var Header = Controls.extend({
        el: templates.subviewheader(),
        render: function () {
            this.options.readOnly &&
                this.$('.specify-add-related, .specify-delete-related').remove();
            return this;
        }
    });

    var AddDeleteBtns = Controls.extend({
        render: function () {
            this.$el.append('<input type="button" value="Add" class="specify-add-related">' +
                            '<input type="button" value="Delete" class="specify-delete-related">');
            return this;
        }
    });

    var Slider = Backbone.View.extend({
        className: 'recordselector-slider',
        events: {
            'slidestop': 'onslidestop',
            'slide': 'onslide'
        },
        initialize: function(options) {
            this.recordSelector = options.recordSelector;

            var _this = this;
            this.throttledSlideStop = _.throttle(function() {
                _this.recordSelector.fetchThenRedraw(_this.getOffset());
            }, 750);

            Backbone.View.prototype.initialize.apply(this, arguments);
        },
        render: function() {
            this.$el.slider();
            this.$('.ui-slider-handle').text(1);
            return this;
        },
        setOptions: function(options) {
            this.$el.slider('option', options);
        },
        getOffset: function() {
            return this.$el.slider('value');
        },
        setOffset: function(val) {
            this.$el.slider('value', val);
        },
        onslidestop: function() {
            this.throttledSlideStop();
        },
        onslide: function() {
            var offset = this.getOffset();
            this.$('.ui-slider-handle').text(offset + 1);
            this.recordSelector.onSlide(offset);
        },
        hide: function() {
            this.$el.hide();
        },
        show: function() {
            this.$el.show();
        }
    });

    return Backbone.View.extend({
        events: {
            'remove': function (evt) {
                (evt.target === this.el) && this.collection.off(null, null, this);
            }
        },
        initialize: function(options) {
            this.form = this.options.form;
            this.readOnly = this.options.readOnly || specifyform.getFormMode(this.form) === 'view';

            this.field = options.field;
            if (this.field && !this.collection.parent)
                throw new Error('parent not defined for collection');

            this.title = this.field ? this.field.getLocalizedName() : this.collection.model.specifyModel.getLocalizedName();
            this.noHeader = _.isUndefined(options.noHeader) ? this.$el.hasClass('no-header') : options.noHeader;
            this.sliderAtTop = _.isUndefined(options.sliderAtTop) ? this.$el.hasClass('slider-at-top') : options.sliderAtTop;
            this.urlParam = options.urlParam || this.$el.data('url-param');

            this.collection.on('add', this.onAdd, this);

            this.collection.on('remove destroy', this.onRemove, this);
        },
        onAdd: function() {
            var end = this.collection.length - 1;
            this.slider.setOptions({ max: end, value: end });
            this.fetchThenRedraw(end) || this.redraw(end);
            this.showHide();
        },
        onRemove: function() {
            var end = this.collection.length - 1;
            if (this.collection.length > 0) {
                var currentIndex = this.currentIndex();
                var value = Math.min(currentIndex, end);
                this.slider.setOptions({ max: end, value: value });
                this.fetchThenRedraw(value) || this.redraw(value);
            }
            this.showHide();
        },
        currentIndex: function() {
            var value = this.slider.getOffset();
            return _.isNumber(value) ? value : 0;
        },
        resourceAt: function(index) {
            return this.collection.at(index);
        },
        currentResource: function() {
            return this.resourceAt(this.currentIndex());
        },
        fetchThenRedraw: function(offset) {
            var self = this;
            if (self.collection.isNew === true || self.collection.at(offset)) return null;
            self.collection.abortFetch();
            var at = offset - offset % BLOCK_SIZE;
            self.request = self.collection.fetch({at: at, limit: BLOCK_SIZE}).done(function() {
                debug && console.log('got collection at offset ' + at);
                self.request = null;
                self.redraw(self.currentIndex());
            });
            return self.request;
        },
        render: function() {
            var self = this;
            self.$el.empty();
            self.slider = new Slider({ recordSelector: this }).render();
            self.slider.setOptions({ max: self.collection.length - 1 });

            self.noHeader || new Header({
                recordSelector: this,
                readOnly: this.readOnly
            }).render().$el.appendTo(this.el);

            self.sliderAtTop && self.$el.append(self.slider.el);

            self.$('.specify-subview-title').text(self.title);
            self.noContent = $(emptyTemplate).appendTo(self.el);

            // we build the form and add it to the DOM immediately so that if it is
            // embedded in a dialog it will be sized properly
            self.content = $('<div>').appendTo(self.el).append(self.form.clone());

            self.spinner = $(spinnerTemplate).appendTo(self.el).hide();

            self.sliderAtTop || self.$el.append(self.slider.el);

            if (self.noHeader && !self.readOnly) {
                new AddDeleteBtns({ recordSelector: this }).render().$el.appendTo(this.el);
            }

            var params = $.deparam.querystring(true);
            var index = params[self.urlParam] || 0;
            index === 'end' && (index = self.collection.length - 1);

            self.slider.setOffset(index);
            self.fetchThenRedraw(index) || self.redraw(index);
            self.showHide();
            return self;
        },
        onSlide: function(offset) {
            if (_(this.collection.at(offset)).isUndefined()) this.showSpinner();
            else _.defer(_.bind(this.redraw, this, offset));
        },
        redraw: function(offset) {
            var self = this;
            debug && console.log('want to redraw at ' + offset);
            var resource = self.resourceAt(offset);
            if (_(resource).isUndefined()) return;
            var form = self.form.clone();
            self.options.populateform(form, resource);
            debug && console.log('filling in at ' + offset);
            self.content.empty().append(form);
            self.hideSpinner();
            if (self.urlParam) {
                var params = {};
                params[self.urlParam] = offset;
                navigation.push($.param.querystring(window.location.pathname, params));
            }
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
        delete: function() {
            var resource = this.currentResource();
            if (this.collection.dependent) {
                this.collection.remove(resource);
            } else {
                resource.isNew() ? resource.destroy() : this.makeDeleteDialog();
            }
        },
        makeDeleteDialog: function() {
            var self = this;
            $(templates.confirmdelete()).appendTo(self.el).dialog({
                resizable: false,
                modal: true,
                buttons: {
                    'Delete': function() {
                        $(this).dialog('close');
                        self.doDestroy();
                    },
                    'Cancel': function() { $(this).remove(); }
                }
            });
        },
        doDestroy: function() {
            this.currentResource().destroy();
        },
        add: function() {
            var newResource = new (this.collection.model)();
            if (this.field) {
                newResource.set(this.field.otherSideName, this.collection.parent.url());
            }
            this.collection.add(newResource);
        },
        visit: function() {
            navigation.go(this.currentResource().viewUrl());
        }
    });
});
