"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var specifyform    = require('./specifyform.js');
var QueryCbxSearch = require('./querycbxsearch.js');
var navigation     = require('./navigation.js');
var subviewheader = require('./templates/subviewheader.html');
var collectionapi  = require('./collectionapi.js');
var assert         = require('./assert.js');
var querystring    = require('./querystring.js');

    var emptyTemplate = '<p>No Data.</p>';

    var Controls = Backbone.View.extend({
        __name__: "RecordSelectorControls",
        initialize: function(options) {
            this.recordSelector = options.recordSelector;
            this.recordSelector.collection.on('add remove destroy', this.showHide, this);
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
        },
        showHide: function() {
            var action = this.recordSelector.collection.length == 0 ? 'hide' : 'show';
            this.$('.specify-delete-related')[action]();
        }
    });

    var Header = Controls.extend({
        __name__: "RecordSelectorHeader",
        initialize: function(options) {
            Controls.prototype.initialize.apply(this, arguments);
            this.recordSelector.collection.on('sync add remove', this.updateCount, this);
        },
        render: function () {
            this.options.readOnly &&
                this.$('.specify-add-related, .specify-delete-related').remove();
            this.updateCount();
            this.showHide();
            return this;
        },
        updateCount: function() {
            var countEl = this.$('.specify-subview-count');
            this.recordSelector.collection.getTotalCount().done(function(count) {
                countEl.show().text('(' + count + ')');
            });
        }
    });

    var AddDeleteBtns = Controls.extend({
        __name__: "RecordSelectorAddDeleteButtons",
        className: "recordselector-add-delete-buttons specify-form-buttons",
        render: function () {
            this.$el.append('<input type="button" value="New" class="specify-add-related">' +
                            '<input type="button" value="Delete" class="specify-delete-related">');
            this.showHide();
            return this;
        }
    });

    var Slider = Backbone.View.extend({
        __name__: "RecordSelectorSlider",
        className: 'recordselector-slider',
        events: {
            'slidestop': 'updateRecordSelector',
            'slide': 'updateRecordSelector'
        },
        initialize: function(options) {
            this.recordSelector = options.recordSelector;
        },
        render: function() {
            $('<div>').appendTo(this.el).slider();
            _.defer(function() {
                this.$el.closest('.ui-dialog')
                    .on("dialogresizestart", this.startResizing.bind(this))
                    .on("dialogresizestop", this.stopResizing.bind(this));
            }.bind(this));
            return this;
        },
        setMax: function(val) {
            this.$('.ui-slider').slider('option', 'max', val);
            this.adjustSize();
        },
        getOffset: function() {
            return this.$('.ui-slider').slider('value');
        },
        setOffset: function(val) {
            this.$('.ui-slider').slider('value', val);
        },
        updateRecordSelector: function(evt, ui) {
            this.recordSelector.redraw(ui.value);
        },
        hide: function() {
            this.$el.hide();
        },
        show: function() {
            this.$el.show();
            _.defer(this.adjustSize.bind(this));
        },
        adjustSize: function() {
            var slider = this.$('.ui-slider');
            var max = slider.slider('option', 'max');
            var size = this.$el.width() / (max + 1);
            slider.width(this.$el.width() - size);
            this.$('.ui-slider-handle').css({
                width: size - 2, // 2px for border
                "margin-left": -size/2
            });
        },
        startResizing: function() {
            this.$('.ui-slider').hide();
        },
        stopResizing: function() {
            this.$('.ui-slider').show();
            _.defer(this.adjustSize.bind(this));
        }
    });

module.exports =  Backbone.View.extend({
        __name__: "RecordSelector",
        className: "recordselector",
        events: {
            'remove': function (evt) {
                (evt.target === this.el) && this.collection.off(null, null, this);
            }
        },
        initialize: function(options) {
            // options = {
            //   populateForm: ref to populateForm function
            //   readOnly: bool,
            //   field: field object? if collection represents related objects,
            //   collection: schema.Model.Collection instance,
            //   noHeader: boolean? overrides form definition,
            //   sliderAtTop: boolean? overrides form definition,
            //   urlParam: string? url parameter name for storing the current index,
            //   subformNode: $(subformNode)? used if the record selector element is not the subview node
            // }
            this.populateForm = options.populateForm;
            this.lazy = this.collection instanceof collectionapi.Lazy; // TODO: meh, instanceof
            this.dependent = this.collection instanceof collectionapi.Dependent;

            this.subformNode = this.options.subformNode || this.$el;

            this.field = options.field; // TODO: this can be gotten from the dependent collection

            this.readOnly =
                !this.dependent ||
                this.options.readOnly ||
                specifyform.subViewMode(this.subformNode) === 'view';

            this.title = this.field ? this.field.getLocalizedName() : this.collection.model.specifyModel.getLocalizedName();
            this.noHeader = _.isUndefined(options.noHeader) ? this.$el.hasClass('no-header') : options.noHeader;
            this.sliderAtTop = _.isUndefined(options.sliderAtTop) ? this.$el.hasClass('slider-at-top') : options.sliderAtTop;
            this.urlParam = options.urlParam || this.$el.data('url-param');

            this.collection.on('add', this.onAdd, this);
            this.collection.on('remove destroy', this.onRemove, this);
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
            if (this.lazy && this.collection.related.isNew()) return this; // not sure this is the best answer.
            var _this = this;
            (this.lazy ? this.collection.fetchIfNotPopulated() : $.when(null)).done(function() {
                _this._render();
            });
            return this;
        },
        _render: function() {
            this.$el.empty();
            this.slider = new Slider({ recordSelector: this }).render();
            this.slider.setMax(this.collection.length - 1);

            this.noHeader || new Header({
                el: subviewheader({
                    title: this.title,
                    dependent: this.dependent
                }),
                recordSelector: this,
                readOnly: this.readOnly
            }).render().$el.appendTo(this.el);

            this.sliderAtTop && this.$el.append(this.slider.el);

            this.noContent = $(emptyTemplate).appendTo(this.el);

            this.content = $('<div>').appendTo(this.el);

            this.sliderAtTop || this.$el.append(this.slider.el);

            if (this.noHeader && !this.readOnly) {
                new AddDeleteBtns({ recordSelector: this }).render().$el.appendTo(this.el);
            }

            var params = querystring.deparam();
            var index = params[this.urlParam] || 0;
            index === 'end' && (index = this.collection.length - 1);

            var mode = this.dependent && !this.readOnly ? 'edit' : 'view';
            specifyform.buildSubView(this.subformNode, mode).done((function(form) {
                this.form = form;
                this.redraw(index);
                this.showHide();
                this.trigger('renderdone', this);
            }).bind(this));
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
            if (resource === this.current) return;
            this.current = resource;
            if (!resource) return;

            var form = this.form.clone();
            this.populateForm(form, resource);
            this.content.empty().append(form);
            if (this.urlParam) {
                var params = {};
                params[this.urlParam] = offset;
                navigation.push(querystring.param(window.location.pathname, params));
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
                if (this.field && !this.collection.related.isNew()) {
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

