define([
    'jquery', 'underscore', 'backbone', 'populateform',
    'text!/static/html/templates/confirmdelete.html',
    'jquery-ui'
], function($, _, Backbone, populateForm, confirmdelete) {
    "use strict";
    return Backbone.View.extend({
        events: {
            'click :submit': 'submit',
            'click :button[value="Delete"]': 'openDeleteDialog'
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
            self.model.rsave().done(function() { self.trigger('savecomplete'); });
        },
        destroy: function() {
            this.deleteDialog.dialog('close');
            this.model.destroy();
            this.undelegateEvents();
            this.$el.empty();
        },
        openDeleteDialog: function(evt) {
            evt.preventDefault();
            this.deleteDialog.dialog('open');
        },
        render: function() {
            var self = this;
            self.undelegateEvents();
            self.$el.empty();
            self.$el.append(populateForm(self.options.form, self.model));
            self.$(':submit').prop('disabled', true);
            if (self.model.isNew()) self.$(':button[value="Delete"]').hide();
            self.deleteDialog = $(confirmdelete).appendTo(self.el).dialog({
                resizable: false, modal: true, autoOpen: false, buttons: {
                    'Delete': _.bind(self.destroy, self),
                    'Cancel': function() { $(this).dialog('close'); }
                }
            });
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
