"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Q        = require('q');
var Backbone = require('./backbone.js');


var specifyform  = require('./specifyform.js');
var SaveButton   = require('./savebutton.js');
var DeleteButton = require('./deletebutton.js');
var assert       = require('./assert.js');
var subviewheader = require('./templates/subviewheader.html');

    var CONTRACT = '<td class="contract"><a title="Contract."><span class="ui-icon ui-icon-triangle-1-s">contract</span></a></td>';
    var EXPAND = '<td class="expand"><a title="Expand."><span class="ui-icon ui-icon-triangle-1-e">expand</span></a></td>';
    var REMOVE = '<td class="remove"><a title="Remove."><span class="ui-icon ui-icon-trash">remove</span></a></td>';

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
            'click .expand a': 'expand',
            'click .contract a': 'contract',
            'click .remove a': 'remove'
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

module.exports =  Backbone.View.extend({
        __name__: "FormTableView",
        events: {
            'click .specify-subview-header a.specify-add-related': 'add'
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

            this.title = this.field ? this.field.getLocalizedName() : this.collection.model.specifyModel.getLocalizedName();

            this.collection.on('add remove distroy', this.reRender, this);

            this.readOnly = specifyform.subViewMode(this.$el) === 'view';
        },
        render: function() {
            var mode = this.readOnly ? 'view' : 'edit';
            Q([
                specifyform.buildSubView(this.$el),
                specifyform.buildViewByName(this.collection.model.specifyModel.view, null, mode)
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
                title: this.title,
                dependent: this.field.isDependent()
            }));

            header.find('.specify-delete-related, .specify-visit-related').remove();
            this.readOnly && header.find('.specify-add-related').remove();
            this.$el.empty().append(header);

            if (this.collection.length < 1) {
                this.$el.append('<p>No Data.</p>');
                return;
            }

            this.collection.each(function(resource, index) {
                let form = this.populateForm(prepForm(this.subform, this.readOnly), resource);

                var el = $('.specify-view-content:first', form);
                if (index === 0)
                    this.$el.append(form);
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

