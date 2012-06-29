define([
    'require', 'jquery', 'underscore', 'backbone', 'populateform',
    'specifyform', 'navigation', 'templates'
], function(require, $, _, Backbone, populateform, specifyform,
            navigation, templates) {

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
        },
        render: function() {
            var self = this;
            var populateForm = require('populateform');
            var header = $(templates.subviewheader());
            header.find('.specify-delete-related').remove();
            self.$el.empty().append(header);
            self.$('.specify-subview-title').text(self.title);
            if (self.collection.length < 1) {
                self.$el.append('<p>nothing here...</p>');
                return;
            }
            var rows = self.collection.map(function(resource, index) {
                var form = specifyform.buildSubView(self.$el);
                var url = resource.viewUrl();
                $('a.specify-edit', form).data('index', index);
                return populateForm(form, resource);
            });
            self.$el.append(rows[0]);
            _(rows).chain().tail().each(function(row) {
                self.$('.specify-view-content-container:first').append($('.specify-view-content:first', row));
            });
        },
        edit: function(evt) {
            var self = this;
            evt.preventDefault();
            var index = $(evt.currentTarget).data('index');
            var popUp = window.open(self.resource.viewUrl() + self.fieldName + '/' + index + '/');
            popUp.specifyParentResource = self.resource;
        },
        add: function(evt) {
            var self = this;
            evt.preventDefault();
            var popUp = window.open(self.resource.viewUrl() + self.fieldName + '/new/');
            popUp.specifyParentResource = self.resource;
        }
    });
});
