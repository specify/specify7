"use strict";

import $ from 'jquery';
import Backbone from './backbone';

import {getIcon} from './icons';
import specifyform from './specifyform';
import * as navigation from './navigation';
import RecordSelector from './recordselector';

import formsText from './localization/forms';
import commonText from './localization/common';
import {className} from "./components/basic";

export const Base =  Backbone.View.extend({
        __name__: "SubviewButtonBaseView",
        events: {
            'click button': 'clicked'
        },
        initialize: function(options) {
            var self = this;
            self.populateForm = options.populateForm;
            self.field = options.field;
            self.relatedModel = self.field.getRelatedModel();

            self.related = self.options.model || self.options.collection;
            self.model = self.options.parentResource || self.options.collection.parent;

            var props = specifyform.parseSpecifyProperties(self.$el.data('specify-initialize'));
            self.icon = props.icon ? getIcon(props.icon) : self.relatedModel.getIcon();
        },
        render: function() {
            var self = this;
            self.readOnly = specifyform.subViewMode(self.$el) === 'view';
            self.$el.empty();

            this.button = $('<button>', {
                type: 'button',
                class: 'button',
                title: self.field.getLocalizedName()
            }).appendTo(self.el)[0];

            if (self.$el.hasClass('specify-subview-in-table'))
                this.button.classList.add('specify-subview-link');
            else
                this.button.innerHTML = `<img
                    class="max-w-[40px] max-h-[20px]"
                    src="${self.icon}"
                    alt=""
                >
                <span class="sr-only">${self.field.getLocalizedName()}</span>
                <span class="specify-subview-button-count bg-white border-gray-500 font-bold p-1 rounded"></span>`;
        },
        setCount: function (c) {
            this.$('.specify-subview-button-count, .specify-subview-link').text(c);
        },
        clicked: function(event) {
            event.preventDefault();
            if (this.dialog) {
                this.dialog.dialog('close');
            } else {
                this.openDialog();
                this.button.ariaPressed = true;
            }
        },
        closeDialog(){
            this.button.ariaPressed = false;
            this.dialog.remove();
            this.dialog = undefined;
        },
    });

    export const ToMany = Base.extend({
        __name__: "ToManySubViewButton",
        initialize: function(options) {
            Base.prototype.initialize.call(this, options);
            this.collection.on('add remove destroy', this.collectionChanged, this);
        },
        render: function() {
            Base.prototype.render.apply(this, arguments);
            this.collectionChanged();
        },
        collectionChanged: function() {
            this.setCount(this.collection.length);
            if (this.collection.length < 1 && this.dialog) this.dialog.dialog('close');
        },
        openDialog: function() {
            var self = this;
            if (self.readOnly && self.collection.length < 1) return;

            new RecordSelector({
                populateForm: this.populateForm,
                field: self.field,
                collection: self.collection,
                subformNode: self.$el,
                readOnly: self.readOnly,
                noHeader: true
            }).on('renderdone', (recordSelector)=>{
                self.dialog = $('<div>').append(recordSelector.el).dialog({
                    width: 'auto',
                    title: self.field.getLocalizedName(),
                    close: this.closeDialog.bind(this)
                });
            }).render();
        }
    });

    export const ToOne = Base.extend({
        __name__: "ToOneSubViewButton",
        initialize: function(options) {
            Base.prototype.initialize.call(this, options);
            this.model.on('change:' + this.field.name.toLowerCase(), this.resourceChanged, this);
        },
        render: function() {
            Base.prototype.render.apply(this, arguments);
            this.resourceChanged();
        },
        resourceChanged: function() {
            this.setCount(this.model.get(this.field.name) ? 1 : 0);
        },
        openDialog: function() {
            var self = this;
            if (self.readOnly && !self.related) return;

            specifyform.buildSubView(self.$el).done(function(dialogForm) {
                self.buildDialog(dialogForm);
            });
        },
        buildDialog: function(dialogForm) {
            var self = this;
            var formReadOnly = specifyform.getFormMode(dialogForm) === 'view';

            dialogForm.find('.specify-form-header:first').remove();
            var buttons = $(`<div class="${className.formFooter}" role="toolbar">`).appendTo(dialogForm);

            if (!self.related) {
                if (formReadOnly) return;
                if (this.field.isDependent()) {
                    self.related = new self.relatedModel.Resource();
                    self.related.placeInSameHierarchy(self.model);
                    self.model.set(self.field.name, self.related);
                    self.resourceChanged();
                } else {
                    // TODO: same as querycbx search
                    throw new Error("not implemented");
                }
            }

            var title = (self.related.isNew() ? "New " : "") + self.relatedModel.getLocalizedName();

            if (!self.readOnly) {
                $(`<button type="button">${commonText('remove')}</button>`)
                    .prependTo(buttons).click(function() {
                        self.dialog.dialog('close');
                        self.related = null;
                        self.model.set(self.field.name, self.related);
                        self.resourceChanged();
                    });
            }

            this.populateForm(dialogForm, self.related);
            self.dialog = $('<div>').append(dialogForm).dialog({
                width: 'auto',
                title: title,
                close: this.closeDialog.bind(this)
            });

            // TODO: this was copied from querycbx. should factor out somehow.
            if (!self.related.isNew() && !self.field.isDependent()) {
                const link = `<a href="${self.related.viewUrl()}">
                    <span class="ui-icon ui-icon-link">
                        ${formsText('link')}
                    </span>
                </a>`;
                self.dialog.closest('.ui-dialog').find('.ui-dialog-titlebar:first').prepend(link);

                self.dialog.parent().delegate('.ui-dialog-title a', 'click', function(evt) {
                    evt.preventDefault();
                    navigation.go(self.related.viewUrl());
                    self.dialog.dialog('close');
                });
            }
        }
    });
