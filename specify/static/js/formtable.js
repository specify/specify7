define([
    'jquery', 'underscore', 'backbone', 'specifyform', 'navigation', 'templates'
], function($, _, Backbone, specifyform, navigation, templates) {

    return Backbone.View.extend({
        events: {
            'click a.specify-edit': 'edit',
            'click .specify-subview-header a.specify-add-related': 'add'
        },
        initialize: function(options) {
            this.resource = options.resource;
            this.specifyModel = options.resource.specifyModel;
            this.fieldName = options.fieldName;
            this.title = this.specifyModel.getField(this.fieldName).getLocalizedName();
            this.collection.on('add', this.render, this);
            this.collection.on('remove destroy', this.render, this);
        },
        render: function() {
            var self = this;
            var header = $(templates.subviewheader());
            header.find('.specify-delete-related').remove();
            header.find('.specify-add-related').prop('href', this.addUrl());
            self.$el.empty().append(header);
            self.$('.specify-subview-title').text(self.title);

            if (self.collection.length < 1) {
                self.$el.append('<p>nothing here...</p>');
                return;
            }

            var rows = self.collection.map(function(resource, index) {
                var form = specifyform.buildSubView(self.$el);
                var url = resource.viewUrl();
                $('a.specify-edit', form).data('index', index).prop('href', self.editUrl(index));
                return self.options.populateform(form, resource);
            });
            self.$el.append(rows[0]);
            _(rows).chain().tail().each(function(row) {
                self.$('.specify-view-content-container:first').append($('.specify-view-content:first', row));
            });
        },
        edit: function(evt) {
            evt.preventDefault();
            var index = $(evt.currentTarget).data('index');
            this.buildDialog(this.collection.at(index));
        },
        editUrl: function(index) {
            return this.resource.viewUrl() + this.fieldName + '/' + index + '/';
        },
        buildDialog: function(resource) {
            var self = this;
            var dialogForm = specifyform.buildViewByName(resource.specifyModel.view);
            self.options.populateform(dialogForm, resource);

            $('<div title="Search">').append(dialogForm).dialog({
                width: 'auto',
                buttons: [
                    {
                        text: resource.isNew() ? "Add" : "Save",
                        click: function() {
                            if (self.collection.dependent) {
                                $(this).remove();
                            } else {
                                var dialog = $(this);
                                resource.save().done(function() { dialog.remove(); });
                            }
                        }
                    }, {
                        text: resource.isNew() ? "Remove" : "Delete",
                        click: function() {
                            if (self.collection.dependent) {
                                self.collection.remove(resource);
                            } else {
                                resource.destroy();
                            }
                            $(this).remove();
                        }
                    }
                ],
                close: function() {
                    $(this).remove();
                }
            });
        },
        add: function(evt) {
            var self = this;
            evt.preventDefault();

            var newResource = new (self.collection.model)();
            var osn = self.specifyModel.getField(self.fieldName).otherSideName;
            newResource.set(osn, self.resource.url());
            self.collection.add(newResource);

            self.buildDialog(newResource);
        },
        addUrl: function() {
            return this.resource.viewUrl() + this.fieldName + '/new/';
        }
    });
});
