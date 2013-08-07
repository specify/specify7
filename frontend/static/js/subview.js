define([
    'require', 'jquery', 'underscore', 'backbone', 'specifyapi',
    'specifyform', 'querycbxsearch', 'templates', 'assert'
], function(require, $, _, Backbone, api, specifyform, QueryCbxSearch, templates, assert) {
    "use strict";
    return Backbone.View.extend({
        __name__: "Subview",
        events: {
            'click .specify-subview-header .specify-delete-related' : 'delete',
            'click .specify-subview-header .specify-add-related' : 'add'
        },
        initialize: function(options) {
            // options = {
            //   field: specify field object that this subview is showing a record for,
            //   model: api.Resource? the resource this subview is showing,
            //   parentResource: api.Resource
            // }
            this.field = options.field;
            this.parentResource = options.parentResource;
            this.title = this.field.getLocalizedName();
        },
        render: function() {
            var self = this;
            self.$el.empty();
            var header = $(templates.subviewheader({
                title: self.title,
                dependent: self.field.isDependent()
            }));
            $('.specify-visit-related', header).remove();

            specifyform.buildSubView(self.$el).done(function(form) {
                if (specifyform.getFormMode(form) === 'view') {
                    $('.specify-delete-related, .specify-add-related', header).remove();
                }
                self.$el.append(header);
                if (!self.model) {
                    $('.specify-delete-related', header).remove();
                    self.$el.append('<p>none...</p>');
                    return;
                } else {
                    $('.specify-add-related', header).remove();
                }

                require("cs!populateform")(form, self.model);
                self.$el.append(form);
            });
            return self;
        },
        add: function() {
            var relatedModel = this.field.getRelatedModel();

            if (this.field.isDependent()) {
                this.model = new (api.Resource.forModel(relatedModel))();
                this.model.placeInSameHierarchy(this.parentResource);
                this.parentResource.set(this.field.name, this.model);
                this.render();
            } else {
                // TODO: this should be factored out from common code in querycbx
                var searchTemplateResource = new (api.Resource.forModel(relatedModel))({}, {
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
});
