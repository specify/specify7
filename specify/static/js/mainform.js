define([
    'jquery', 'underscore', 'backbone', 'populateform', 'schemalocalization', 'specifyform',
    'text!/static/html/templates/subviewheader.html'
], function($, _, Backbone, populateForm, schemalocalization, specifyform, subviewheader) {
    "use strict";
    return Backbone.View.extend({
        events: {
            'click :submit': 'submit',
            'click :button[value="Delete"]': 'delete'
        },
        initialize: function(options) {
            var self = this;
            self.model.on('saverequired', function() {
                self.$(':submit').prop('disabled', false);
            });
        },
        submit: function(evt) {
            var self = this;
            evt.preventDefault();
            self.$(':submit').prop('disabled', true);
            self.model.rsave().done(function() {
            });
        },
        'delete': function(evt) {
            var self = this;
            evt.preventDefault();
            self.model.destroy();
        },
        render: function() {
            var self = this;
            self.undelegateEvents();
            self.$el.empty();
            self.$el.append(populateForm(self.options.form, self.model));
            self.$(':submit').prop('disabled', true);
            self.model.isNew() && self.$(':button[value="Delete"]').hide();
            self.delegateEvents();
            return self;
        },
        remove: function() {
            this.undelegateEvents();
            this.$el.empty();
            return this;
        }
    });
});
