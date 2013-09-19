define([
    'require', 'jquery', 'underscore', 'backbone', 'specifyform', 'querycbxsearch',
    'navigation', 'templates', 'collectionapi', 'assert', 'jquery-ui'
], function(require, $, _, Backbone, specifyform, QueryCbxSearch, navigation, templates, collectionapi, assert) {
    "use strict";
    var emptyTemplate = '<p>nothing here...</p>';

    var Controls = Backbone.View.extend({
        __name__: "RecordSelectorControls",
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
        __name__: "RecordSelectorHeader",
        render: function () {
            this.options.readOnly &&
                this.$('.specify-add-related, .specify-delete-related').remove();
            return this;
        }
    });

    var AddDeleteBtns = Controls.extend({
        __name__: "RecordSelectorAddDeleteButtons",
        render: function () {
            this.$el.append('<input type="button" value="Add" class="specify-add-related">' +
                            '<input type="button" value="Delete" class="specify-delete-related">');
            return this;
        }
    });

    var Slider = Backbone.View.extend({
        __name__: "RecordSelectorSlider",
        className: 'recordselector-slider',
        events: {
            'slidestop': 'onslidestop',
            'slide': 'onslide'
        },
        initialize: function(options) {
            this.recordSelector = options.recordSelector;
        },
        render: function() {
            this.$el.slider();
            this.$('.ui-slider-handle').text(1);
            return this;
        },
        setMax: function(val) {
            this.$el.slider('option', 'max', val);
        },
        getOffset: function() {
            return this.$el.slider('value');
        },
        setOffset: function(val) {
            this.$el.slider('value', val);
            this.setText(val);
        },
        onslidestop: function(evt, ui) {
            this.recordSelector.redraw(ui.value);
        },
        onslide: function(evt, ui) {
            this.setText(ui.value);
        },
        hide: function() {
            this.$el.hide();
        },
        show: function() {
            this.$el.show();
        },
        setText: function(offset) {
            this.$('.ui-slider-handle').text(offset + 1);
        }
    });

    return Backbone.View.extend({
        __name__: "RecordSelector",
        events: {
            'remove': function (evt) {
                (evt.target === this.el) && this.collection.off(null, null, this);
            }
        },
        initialize: function(options) {
            // options = {
            //   readOnly: bool,
            //   field: field object? if collection represents related objects,
            //   collection: schema.Model.Collection instance,
            //   noHeader: boolean? overrides form definition,
            //   sliderAtTop: boolean? overrides form definition,
            //   urlParam: string? url parameter name for storing the current index,
            //   subformNode: $(subformNode)? used if the record selector element is not the subview node
            // }
            this.lazy = this.collection instanceof collectionapi.Lazy; // TODO: meh, instanceof
            this.dependent = this.collection instanceof collectionapi.Dependent;

            this.subformNode = this.options.subformNode || this.$el;

            this.readOnly = this.options.readOnly || specifyform.subViewMode(this.subformNode) === 'view';

            this.field = options.field; // TODO: this can be gotten from the dependent collection
            this.title = this.field ? this.field.getLocalizedName() : this.collection.model.specifyModel.getLocalizedName();
            this.noHeader = _.isUndefined(options.noHeader) ? this.$el.hasClass('no-header') : options.noHeader;
            this.sliderAtTop = _.isUndefined(options.sliderAtTop) ? this.$el.hasClass('slider-at-top') : options.sliderAtTop;
            this.urlParam = options.urlParam || this.$el.data('url-param');

            this.collection.on('add', this.onAdd, this);

            this.collection.on('remove destroy', this.onRemove, this);
            this.populateForm = require('cs!populateform');
        },
        onAdd: function() {
            var end = this.collection.length - 1;
            this.slider.setMax(end);
            this.redraw(end);
            this.showHide();
        },
        onRemove: function() {
            var end = this.collection.length - 1;
            if (this.collection.length > 0) {
                var currentIndex = this.currentIndex();
                var value = Math.min(currentIndex, end);
                this.slider.setMax(end);
                this.redraw(value);
            }
            this.showHide();
        },
        currentIndex: function() {
            var value = this.slider.getOffset();
            return _.isNumber(value) ? value : 0;
        },
        currentResource: function() {
            return this.current;
        },
        render: function() {
            var _this = this;
            (this.lazy ? this.collection.fetchIfNotPopulated() : $.when(null)).done(function() {
                _this._render();
            });
            return this;
        },
        _render: function() {
            var self = this;
            self.$el.empty();
            self.slider = new Slider({ recordSelector: this }).render();
            self.slider.setMax(self.collection.length - 1);

            self.noHeader || new Header({
                el: templates.subviewheader({
                    title: self.title,
                    dependent: self.dependent
                }),
                recordSelector: this,
                readOnly: this.readOnly
            }).render().$el.appendTo(this.el);

            self.sliderAtTop && self.$el.append(self.slider.el);

            self.noContent = $(emptyTemplate).appendTo(self.el);

            self.content = $('<div>').appendTo(self.el);

            self.sliderAtTop || self.$el.append(self.slider.el);

            if (self.noHeader && !self.readOnly) {
                new AddDeleteBtns({ recordSelector: this }).render().$el.appendTo(this.el);
            }

            var params = $.deparam.querystring(true);
            var index = params[self.urlParam] || 0;
            index === 'end' && (index = self.collection.length - 1);

            var mode = self.dependent && !self.readOnly ? 'edit' : 'view';
            specifyform.buildSubView(self.subformNode, mode).done(function(form) {
                self.form = form;
                self.redraw(index);
                self.showHide();

            });
        },
        redraw: function(offset) {
            this.slider.setOffset(offset);
            this.fillIn(this.collection.at(offset), offset);
            if (this.lazy && offset === this.collection.length - 1 && !this.collection.isComplete()) {
                this.fetchMore();
            }
        },
        fetchMore: function() {
            var _this = this;

            // TODO: maybe add isFetching method to collection
            (this.collection._fetch || this.collection.fetch()).done(function() {
                _this.slider.setMax(_this.collection.length - 1);
            });
        },
        fillIn: function(resource, offset) {
            self = this;
            if (resource === self.current) return;
            self.current = resource;
            if (!resource) return;

            var form = self.form.clone();
            self.populateForm(form, resource);
            self.content.empty().append(form);
            if (self.urlParam) {
                var params = {};
                params[self.urlParam] = offset;
                navigation.push($.param.querystring(window.location.pathname, params));
            }
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
        },
        delete: function() {
            var resource = this.currentResource();
            if (this.dependent) {
                this.collection.remove(resource);
            } else {
                var _this = this;
                var dialog = $('<div>').text("Remove?").dialog({ // TODO: better message
                    modal: true,
                    title: resource.specifyModel.getLocalizedName(),
                    buttons: {
                        Ok: function() {
                            _this.collection.remove(resource);
                            resource.set(_this.field.otherSideName, null);
                            resource.save();
                            dialog.dialog('close');
                        },
                        Cancel: function() { dialog.dialog('close'); }
                    }
                });
            }
        },
        add: function() {
            if (this.dependent) {
                var newResource = new this.collection.model();
                if (this.field) {
                    newResource.set(this.field.otherSideName, this.collection.related.url());
                }
                this.collection.add(newResource);
            } else {

                // TODO: this should be factored out from common code in querycbx
                var searchTemplateResource = new this.collection.model({}, {
                    noBusinessRules: true,
                    noValidation: true
                });

                var _this = this;
                new QueryCbxSearch({
                    model: searchTemplateResource,
                    selected: function(resource) {
                        resource.set(_this.field.otherSideName, _this.collection.related.url());
                        resource.save(); // TODO: make confirmation dialog
                    }
                }).render();
            }
        },
        visit: function() {
            navigation.go(this.currentResource().viewUrl());
        }
    });
});
