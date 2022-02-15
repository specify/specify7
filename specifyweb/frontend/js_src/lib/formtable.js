"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Q from 'q';
import Backbone from './backbone';


import specifyform from './specifyform';
import { assert } from './assert';
import subviewheader from './templates/subviewheader.html';
import formsText from './localization/forms';
import commonText from './localization/common';
import {legacyNonJsxIcons} from './components/icons';

const CONTRACT = `<td class="contract">
        <button
          type="button" 
          class="link"
          title="${formsText('contract')}"
          aria-label="${formsText('contract')}"
        >
            ${legacyNonJsxIcons.chevronDown}
        </button>
    </td>`;
    const EXPAND = `<td class="expand">
        <button
          type="button"
          class="link"
          title="${commonText('expand')}"
          aria-label="${commonText('expand')}"
        >
            ${legacyNonJsxIcons.chevronRight}
        </button>
    </td>`;
    const REMOVE = `<td class="remove">
        <button
          type="button"
          class="link"
          title="${commonText('remove')}"
          aria-label="${commonText('remove')}"
        >
            ${legacyNonJsxIcons.trash}
        </button>
    </td>`;

    function prepForm(formIn, readOnly) {
        let form = formIn.clone();
        $('thead tr', form).prepend('<th>');
        $('tbody tr', form).prepend(EXPAND);
        if (!readOnly) {
            $('tbody tr', form).append(REMOVE);
            $('thead tr', form).append('<th>');
        }
        return form;
    }

    var FormTableRow = Backbone.View.extend({
        __name__: "FormTableRow",
        events: {
            'click .expand button': 'expand',
            'click .contract button': 'contract',
            'click .remove button': 'remove'
        },
        initialize: function({populateForm, form, expandedForm, readOnly}) {
            this.populateForm = populateForm;
            this.form = form;
            this.expandedForm = expandedForm;
            this.readOnly = readOnly;
        },
        expand: function() {
            var colspan = this.$el.children().length - 1 - (this.readOnly ? 0 : 1);
            this.$el.empty().append(
                $(CONTRACT),
                $('<td class="expanded-form" colspan="' + colspan + '">'));

            this.readOnly || $(REMOVE).appendTo(this.el);

            var expandedForm = this.expandedForm.clone();

            expandedForm.find('.specify-form-header:first').remove();
            this.populateForm(expandedForm, this.model);
            this.$('.expanded-form').append(expandedForm);
        },
        contract: function() {
            let form = this.populateForm(prepForm(this.form, this.readOnly), this.model);
            this.$el.empty().append(form.find('.specify-view-content:first').children());
            return this;
        },
        remove: function() {
            this.model.collection.remove(this.model);
        }
    });

export default Backbone.View.extend({
        __name__: "FormTableView",
        events: {
            'click .specify-subview-header button.specify-add-related': 'add'
        },
        initialize: function(options) {
            // options = {
            //   populateForm: ref to populateForm function
            //   field: specifyfield object?
            //   collection: schema.Model.Collection instance for table
            //   subformNode: subform stub from parent form
            this.populateForm = options.populateForm;
            this.field = this.options.field; // TODO: field can be gotten from collection
            assert(this.field.isDependent(), "formtable is only for dependent fields");
            assert(this.collection.field === this.field.getReverse(), "collection doesn't represent field");

            this.title = this.field ? this.field.label : this.collection.model.specifyModel.label;

            this.collection.on('add remove destroy', this.reRender, this);

            this.readOnly = specifyform.subViewMode(this.$el) === 'view';
        },
        render: function() {
            var mode = this.readOnly ? 'view' : 'edit';
            Q([
                specifyform.buildSubView(this.$el),
                specifyform.buildViewByName(this.collection.model.specifyModel.view, null, mode, true)
            ]).spread(function(subform, expandedForm) {
                this.subform = subform;
                this.expandedForm = expandedForm;
                this._render();
            }.bind(this));
            return this;
        },
        reRender: function() {
            var currentRender = this.collection.pluck('cid');
            if (this.lastRender && this.lastRender.length == currentRender.length &&
                _.all(_.zip(this.lastRender, currentRender), function(pair) {
                    return pair[0] == pair[1];
                })) return; // no change
            this._render();
        },
        _render: function() {
            this.lastRender = this.collection.pluck('cid');

            var header = $(subviewheader({
                formsText,
                commonText,
                title: this.title,
                dependent: this.field.isDependent(),
                legacyNonJsxIcons,
            }));

            header.find('.specify-delete-related, .specify-visit-related').remove();
            this.readOnly && header.find('.specify-add-related').remove();

            this.el.innerHTML = '<fieldset class="py-3"></fieldset>';
            const section = $(this.el.children[0]);
            section.append(header);

            if (this.collection.length < 1) {
                section.append(`<p>${formsText('noData')}</p>`);
                return;
            }

            this.collection.each(function(resource, index) {
                let form = this.populateForm(prepForm(this.subform, this.readOnly), resource);

                var el = $('.specify-view-content:first', form);
                if (index === 0)
                    section.append(form);
                else
                    this.$('.specify-view-content-container:first').append(el);

                var row = new FormTableRow({
                    populateForm: this.populateForm,
                    el: el,
                    model: resource,
                    form: this.subform,
                    expandedForm: this.expandedForm,
                    readOnly: this.readOnly
                });

                if (this.added === resource) {
                    row.expand();
                    this.added = null;
                } else if (resource.isNew()) {
                    row.expand();
                }
            }, this);
        },
        add: function(evt) {
            evt.preventDefault();

            var newResource = new (this.collection.model)();
            // Setting the backref here is superfulous because it will be set by parent object
            // when it is saved. Trying to do so now messes things up if the parent object
            // is not yet persisted.
            // if (self.field) {
            //     newResource.set(self.field.otherSideName, self.collection.related.url());
            // }
            this.added = newResource;
            this.collection.related && this.collection.add(newResource);
        }
    });

