"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import specifyform from './specifyform';
import QueryCbxSearch from './querycbxsearch';
import * as navigation from './navigation';
import subviewheader from './templates/subviewheader.html';
import collectionapi from './collectionapi';
import * as querystring from './querystring';
import formsText from './localization/forms';
import commonText from './localization/common';
import {className} from "./components/basic";
import {legacyNonJsxIcons} from "./components/icons";

// TODO: convert to React
var emptyTemplate = `<p>${formsText('noData')}</p>`;

    var Controls = Backbone.View.extend({
        __name__: "RecordSelectorControls",
        initialize: function(options) {
            this.recordSelector = options.recordSelector;
            this.recordSelector.collection.on('add remove destroy', this.showHide, this);
            Backbone.View.prototype.initialize.call(this, options);
        },
        events: {
            'click .specify-add-related': function () {
                this.recordSelector.add();
            },
            'click .specify-delete-related': function () {
                this.recordSelector.delete();
            },
            'click .specify-visit-related': function () {
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
        initialize: function() {
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
                countEl.show().text(`(${count})`);
            });
        }
    });

    var AddDeleteBtns = Controls.extend({
        __name__: "RecordSelectorAddDeleteButtons",
        className: className.formFooter,
        render: function () {
            this.el.role = 'toolbar';
            this.$el.append(`
                <button
                    type="button"
                    class="button specify-delete-related"
                >${commonText('delete')}</button>
                <button
                    type="button"
                    class="button specify-add-related"
                >${commonText('new')}</button>
            `);
            this.showHide();
            return this;
        }
    });

    const Slider = Backbone.View.extend({
        __name__: "RecordSelectorSlider",
        className: 'flex justify-center gap-x-2 print:hidden',
        tagName: 'div',
        events: {
            'change': 'reportChange',
            'input': 'resize',
            'click button': 'handleClick',
        },
        initialize({onChange: handleChange}) {
            this.handleChange = handleChange;
        },
        render() {
            this.el.innerHTML = `
                <button
                    class="button"
                    data-action="first"
                    aria-label="${formsText('firstRecord')}"
                    title="${formsText('firstRecord')}"
                    type="button"
                    disabled
                >≪</button>
                <button
                    class="button bg-white dark:bg-neutral-500 px-4"
                    data-action="previous"
                    aria-label="${formsText('previousRecord')}"
                    title="${formsText('previousRecord')}"
                    type="button"
                    disabled
                >&lt;</button>
                <div class="grid font-bold items-center grid-cols-[1fr_auto_1fr]">
                    <label class="input-container h-full relative
                        after:invisible after:p-2 after:content-[attr(data-value)]">
                        <span class="input-label sr-only"></span>
                        <input type="number" class="absolute bg-white border-0
                            font-bold h-full w-full left-0 no-arrows top-0
                            dark:bg-neutral-600" min="1" step="1">
                    </label>
                    <span>/</span>
                    <span class="max-indicator"></span>
                </div>
                <button
                    class="button bg-white dark:bg-neutral-500 px-4"
                    data-action="next"
                    aria-label="${formsText('nextRecord')}"
                    title="${formsText('nextRecord')}"
                    type="button"
                    disabled
                >&gt;</button>
                <button
                    class="button"
                    data-action="last"
                    aria-label="${formsText('lastRecord')}"
                    title="${formsText('lastRecord')}"
                    type="button"
                    disabled
                >≫</button>
            `;

            this.buttons = Object.fromEntries(
                Array.from(
                    this.el.getElementsByTagName('button'),
                    (button)=>[button.getAttribute('data-action'), button]
                )
            );

            this.inputContainer =
                this.el.getElementsByClassName('input-container')[0];
            this.inputLabel =
              this.el.getElementsByClassName('input-label')[0];
            this.input = this.el.getElementsByTagName('input')[0];
            this.maxIndicator =
                this.el.getElementsByClassName('max-indicator')[0];
            this.hide();
            return this;
        },
        setMax(value) {
            this.input.max = Math.max(1,value + 1);
            this.maxIndicator.textContent = this.input.max;
            this.inputLabel.textContent =
              formsText('currentRecord')(this.input.max);
        },
        getOffset() {
            return this.input.value - 1;
        },
        setOffset(value) {
            this.input.value = value + 1;
            this.afterValueChange();
        },
        afterValueChange(){
            this.resize();
            this.validate();
            this.updateButtons();
        },
        reportChange() {
            this.afterValueChange();
            this.handleChange(this.getOffset());
        },
        resize(){
            // This let's CSS resize the input to fit the value
            this.inputContainer.setAttribute('data-value', this.input.value);
        },
        validate(){
            const value = Number.parseInt(this.input.value) || 0;
            if(value > this.input.max)
                this.input.value = this.input.max;
            if(value < this.input.min)
                this.input.value = this.input.min;
        },
        updateButtons(){
            const isFirst = this.input.value === this.input.min;
            const isLast = this.input.value === this.input.max;
            this.buttons['first'].disabled = isFirst;
            this.buttons['previous'].disabled = isFirst;
            this.buttons['next'].disabled = isLast;
            this.buttons['last'].disabled = isLast;
        },
        handleClick({target}){
            const action = target.getAttribute('data-action');
            if(action === 'first')
                this.input.value = 0;
            else if(action === 'previous')
                this.input.value -= 1;
            else if(action === 'next')
                this.input.value = Number.parseInt(this.input.value) + 1;
            else if(action === 'last')
                this.input.value = this.input.max;
            this.reportChange();
        },
        hide() {
            this.$el.hide();
        },
        show() {
            this.$el.show();
        },
    });

export default Backbone.View.extend({
        __name__: "RecordSelector",
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

            this.title = this.field ? this.field.label : this.collection.model.specifyModel.label;
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
            this.el.innerHTML = this.noHeader ? '<div></div>' : '<fieldset></fieldset>';
            const section = $(this.el.children[0]);
            const sliderContainer = document.createElement('div');
            this.slider = new Slider({ onChange: this.redraw.bind(this) }).render();
            this.slider.setMax(this.collection.length - 1);
            sliderContainer.append(this.slider.el);

            this.noHeader || new Header({
                el: subviewheader({
                    formsText,
                    commonText,
                    title: this.title,
                    dependent: this.dependent,
                    legacyNonJsxIcons
                }),
                recordSelector: this,
                readOnly: this.readOnly
            }).render().$el.appendTo(section);

            this.sliderAtTop && section.append(sliderContainer);

            this.noContent = $(emptyTemplate).appendTo(section);

            this.content = $('<div>').appendTo(section);

            this.sliderAtTop || section.append(sliderContainer);

            if (this.noHeader && !this.readOnly) {
                new AddDeleteBtns({ recordSelector: this }).render().$el.appendTo(section);
            }

            var params = querystring.parse();
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
                navigation.push(querystring.format(window.location.url, params));
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
                var dialog = $(`<div>
                    ${formsText('removeRecordDialogHeader')}
                    <p>${formsText('removeRecordDialogMessage')}</p>
                </div>`).dialog({
                    modal: true,
                    title: resource.specifyModel.label,
                    buttons: {
                        [commonText('remove')]: function() {
                            _this.collection.remove(resource);
                            resource.set(_this.field.otherSideName, null);
                            resource.save();
                            dialog.dialog('close');
                        },
                        [commonText('cancel')]: function() { dialog.dialog('close'); }
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
            if(typeof this.current !== 'undefined')
                navigation.go(this.current.viewUrl());
        }
    });

