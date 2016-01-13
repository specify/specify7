"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var schema         = require('./schema.js');
var specifyform    = require('./specifyform.js');
var QueryCbxSearch = require('./querycbxsearch.js');
var subviewheader = require('./templates/subviewheader.html');

module.exports =  Backbone.View.extend({
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
            this.title = this.field.getLocalizedName();
            this.readOnly = specifyform.subViewMode(this.$el) === 'view';
        },
        render: function() {
            var self = this;
            self.$el.empty();
            var header = $(subviewheader({
                title: self.title,
                dependent: self.field.isDependent()
            }));
            $('.specify-visit-related', header).remove();

            var embeddedCE = self.field.isDependent() &&
                self.field === schema.models.CollectionObject.getField('collectingevent');

            if (embeddedCE){
                $('.specify-delete-related, .specify-add-related', header).remove();
            } else {
                header.on('click', '.specify-delete-related', this.delete.bind(this));
                header.on('click', '.specify-add-related', this.add.bind(this));
            }

            var mode = self.field.isDependent() && !this.readOnly ? 'edit' : 'view';
            specifyform.buildSubView(self.$el, mode).done(function(form) {
                self.readOnly && $('.specify-delete-related, .specify-add-related', header).remove();

                self.$el.append(header);
                if (!self.model) {
                    $('.specify-delete-related', header).remove();
                    self.$el.append('<p>No Data.</p>');
                    return;
                } else {
                    $('.specify-add-related', header).remove();
                }

                self.populateForm(form, self.model);
                self.$el.append(form);
            });
            return self;
        },
        add: function() {
            var relatedModel = this.field.getRelatedModel();

            if (this.field.isDependent()) {
                this.model = new relatedModel.Resource();
                this.model.placeInSameHierarchy(this.parentResource);
                this.parentResource.set(this.field.name, this.model);
                this.render();
            } else {
                // TODO: this should be factored out from common code in querycbx
                var searchTemplateResource = new relatedModel.Resource({}, {
                    noBusinessRules: true,
                    noValidation: true
                });

                var _this = this;
                this.dialog = new QueryCbxSearch({
                    model: searchTemplateResource,
                    selected: function(resource) {
                        _this.model.set(_this.fieldName, resource);
                    }
                }).render().$el.on('remove', function() { _this.dialog = null; });
            }
        },
        delete: function() {
            this.parentResource.set(this.field.name, null);
            this.model = null;
            this.render();
        }
    });

