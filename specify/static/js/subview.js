define([
    'require', 'jquery', 'underscore', 'backbone', 'populateform', 'specifyform', 'templates'
], function(require, $, _, Backbone, populateform, specifyform, templates) {
    "use strict";
    return Backbone.View.extend({
        initialize: function(options) {
            this.resource = options.resource;
            this.specifyModel = options.resource.specifyModel;
            this.fieldName = options.fieldName;
            this.title = this.specifyModel.getField(this.fieldName).getLocalizedName();
        },
        render: function() {
            var self = this;
            var populateForm = require('populateform');
            self.undelegateEvents();
            self.$el.empty().append(templates.subviewheader());
            self.$('.specify-subview-title').text(self.title);
            if (!self.model) {
                self.$el.append('<p>none...</p>');
                return;
            }
            self.$el.append(populateForm(specifyform.buildSubView(self.$el), self.model));
            self.delegateEvents();
            return self;
        }
    });
});
