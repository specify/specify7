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
            header.find('.specify-add-related').prop('href', this.addUrl());
            self.undelegateEvents();
            self.$el.empty().append(header);
            self.$('.specify-subview-title').text(self.title);
            if (self.collection.length < 1) {
                self.$el.append('<p>nothing here...</p>');
                return;
            }
            var rows = self.collection.map(function(resource) {
                var form = specifyform.buildSubView(self.$el);
                var url = resource.viewUrl();
                $('a.specify-edit', form).prop('href', url)
                    .data('backbone-url', url.replace(/^\/specify/, ''));
                return populateForm(form, resource);
            });
            self.$el.append(rows[0]);
            _(rows).chain().tail().each(function(row) {
                self.$('.specify-view-content-container:first').append($('.specify-view-content:first', row));
            });
            self.delegateEvents();
        },
        edit: function(evt) {
            evt.preventDefault();
            navigation.go($(evt.currentTarget).data('backbone-url'))
        },
        add: function(evt) {
            evt.preventDefault();
            navigation.go(this.addUrl());
        },
        addUrl: function() {
            return this.resource.viewUrl() + this.fieldName + '/new/';
        }
    });
});
