define([
    'require', 'jquery', 'underscore', 'backbone', 'populateform', 'specifyform',
    'text!/static/html/templates/subviewheader.html'
], function(require, $, _, Backbone, populateform, specifyform, subviewheader) {
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
            self.$el.empty().append(subviewheader);
            self.$('.specify-subview-title').text(self.title);
            if (!self.model) {
                self.$el.append('<p style="text-align: center">none...</p>');
                return;
            }
            self.$el.append(populateForm(specifyform.buildSubView(self.$el), self.model));
            self.delegateEvents();
            return self;
        }
    });
});
