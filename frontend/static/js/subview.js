define([
    'require', 'jquery', 'underscore', 'backbone', 'specifyapi', 'specifyform', 'templates', 'assert'
], function(require, $, _, Backbone, api, specifyform, templates, assert) {
    "use strict";
    return Backbone.View.extend({
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
            var header = $(templates.subviewheader());
            $('.specify-visit-related', header).remove();
            $('.specify-subview-title', header).text(self.title);
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
            var self = this;
            var relatedModel = self.field.getRelatedModel();
            self.model = new (api.Resource.forModel(relatedModel))();
            self.model.placeInSameHierarchy(self.parentResource);
            self.parentResource.set(self.field.name, self.model);
            self.render();
        },
        delete: function() {
            this.parentResource.set(this.field.name, null);
            this.model = null;
            this.render();
        }
    });
});
