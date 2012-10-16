define([
    'jquery', 'underscore', 'backbone', 'specifyapi', 'specifyform', 'templates'
], function($, _, Backbone, api, specifyform, templates) {
    "use strict";
    return Backbone.View.extend({
        events: {
            'click .specify-subview-header .specify-delete-related' : 'delete',
            'click .specify-subview-header .specify-add-related' : 'add'
        },
        initialize: function(options) {
            this.parentResource = options.parentResource;
            this.field = options.field;
            this.title = this.field.getLocalizedName();
        },
        render: function() {
            var self = this;
            self.$el.empty().append(templates.subviewheader());
            self.$('.specify-subview-title').text(self.title);
            if (!self.model) {
                self.$('.specify-delete-related').remove();
                self.$el.append('<p>none...</p>');
                return;
            } else {
                self.$('.specify-add-related').remove();
            }

            var form = specifyform.buildSubView(self.$el);
            self.options.populateform(form, self.model);
            self.$el.append(form);
            return self;
        },
        add: function() {
            var self = this;
            var relatedModel = self.field.getRelatedModel();
            self.model = new (api.Resource.forModel(relatedModel))();
            self.model.placeInSameHierarchy(self.parentResource);
            self.parentResource.setToOneField(self.field.name, self.model);
            self.render();
        },
        makeDeleteDialog: function(resource, callback) {
            var self = this;
            $(templates.confirmdelete()).appendTo(self.el).dialog({
                resizable: false,
                modal: true,
                buttons: {
                    'Delete': function() {
                        $(this).dialog('close');
                        resource.destroy().done(callback);
                    },
                    'Cancel': function() { $(this).remove(); }
                }
            });
        },
        delete: function() {
            var self = this;
            function done() {
                self.model = null;
                self.parentResource.setToOneField(self.field.name, null, {silent: true});
                self.render();
            }
            if (self.model.isNew()) done()
            else self.makeDeleteDialog(self.model, done);

        }
    });
});
