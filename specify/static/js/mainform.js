define([
    'jquery', 'underscore', 'backbone', 'populateform', 'schemalocalization', 'specifyform',
    'text!/static/html/templates/subviewheader.html'
], function($, _, Backbone, populateForm, schemalocalization, specifyform, subviewheader) {
    "use strict";
    return Backbone.View.extend({
        events: {
            'click :submit': 'submit'
        },
        initialize: function(options) {
            var self = this;
            self.model.on('saverequired', function() {
                self.$(':submit').prop('disabled', false);
            });
        },
        submit: function(evt) {
            evt.preventDefault();
            self.$(':submit').prop('disabled', true);
            this.model.rsave().done(function() {
            });
        },
        render: function() {
            var self = this;
            self.undelegateEvents();
            self.$el.empty();
            self.$el.append(populateForm(self.options.form, self.model));
            self.$(':submit').prop('disabled', true);
            self.delegateEvents();
            return self;
        }
    });
});
