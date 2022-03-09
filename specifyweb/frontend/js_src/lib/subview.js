"use strict";

import $ from 'jquery';
import Backbone from './backbone';

import {schema} from './schema';
import specifyform from './specifyform';
import QueryCbxSearch from './querycbxsearch';
import subviewheader from './templates/subviewheader.html';
import formsText from './localization/forms';
import commonText from './localization/common';
import {legacyNonJsxIcons} from './components/icons';
import {className} from './components/basic';

// TODO: rewrite to React
export default Backbone.View.extend({
        __name__: "Subview",
        initialize: function(options) {
            // options = {
            //   populateForm: ref to populateForm function
            //   field: specify field object that this subview is showing a record for,
            //   model: schema.Model.Resource? the resource this subview is showing,
            //   parentResource: schema.Model.Resource
            // }
            this.populateForm = options.populateForm;
            this.field = options.field;
            this.parentResource = options.parentResource;
            this.title = this.field.label;
            this.readOnly = specifyform.subViewMode(this.el) === 'view';

            this.parentResource.on('change:' + this.field.name.toLowerCase(),
                                   this.resourceChanged, this);
        },
        render: function() {
            var self = this;
            self.el.innerHTML = '<fieldset class="py-3"></fieldset>';
            const section = $(self.el.children[0]);
            var header = $(subviewheader({
                className,
                formsText,
                commonText,
                title: self.title,
                dependent: self.field.isDependent(),
                legacyNonJsxIcons,
            }));
            $('.specify-visit-related', header).remove();

            var embeddedCE = self.field.isDependent() &&
                self.field === schema.models.CollectionObject.getField('collectingevent');

            if (embeddedCE){
                $('.specify-delete-related', header).remove();
            } else {
                header.on('click', '.specify-delete-related', this.delete.bind(this));
            }
            header.on('click', '.specify-add-related', this.add.bind(this));

            var mode = self.field.isDependent() && !this.readOnly ? 'edit' : 'view';
            specifyform.buildSubView(self.$el, mode).done(function(form) {
                self.readOnly && $('.specify-delete-related, .specify-add-related', header).remove();

                section.append(header);
                if (!self.model) {
                    $('.specify-delete-related', header).remove();
                    section.append(`<p>${formsText('noData')}</p>`);
                    return;
                } else {
                    $('.specify-add-related', header).remove();
                }

                self.populateForm(form, self.model);
                section.append(form);
            });
            return self;
        },
        add: function() {
            var relatedModel = this.field.relatedModel;

            if (this.field.isDependent()) {
                this.model = new relatedModel.Resource();
                this.model.placeInSameHierarchy(this.parentResource);
                this.parentResource.set(this.field.name, this.model);
            } else {
                // TODO: this should be factored out from common code in querycbx
                var searchTemplateResource = new relatedModel.Resource({}, {
                    noBusinessRules: true,
                    noValidation: true
                });

                var _this = this;
                this.dialog = new QueryCbxSearch({
                    model: searchTemplateResource,
                    populateForm: this.populateForm,
                    selected: function(resource) {
                        _this.model.set(_this.fieldName, resource);
                    }
                }).render().$el.on('remove', function() { _this.dialog = null; });
            }
        },
        delete: function() {
            this.parentResource.set(this.field.name, null);
        },
    resourceChanged: function() {
        this.parentResource.rget(this.field.name).done(resource => {
            this.model = resource;
            this.render();
        });
    }
});

