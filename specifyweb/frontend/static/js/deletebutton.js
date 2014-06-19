define(['jquery', 'underscore', 'backbone', 'templates'], function($, _, Backbone, templates) {
    "use strict";

    return Backbone.View.extend({
        __name__: "DeleteButton",
        events: {
            'click .delete-button': 'openDialog'
        },
        initialize: function(options) {
            this.model.on('candelete', function() {
                this.button.prop('disabled', false);
                this.setToolTip();
            }, this);

            this.model.on('deleteblocked', function() {
                this.button.prop('disabled', true);
                this.setToolTip();
            }, this);
        },
        render: function() {
            this.$el.addClass('deletebutton');
            this.button = $('<input type="button" value="Delete" class="delete-button">').appendTo(this.el);
            this.button.prop('disabled', true);
            this.model.businessRuleMgr.checkCanDelete().done(this.setToolTip.bind(this));
            return this;
        },
        openDialog: function(evt) {
            evt.preventDefault();
            var doDelete = this.doDelete.bind(this);

            var dialog = $(templates.confirmdelete()).appendTo(this.el).dialog({
                resizable: false,
                close: function() { dialog.remove(); },
                modal: true,
                buttons: {
                    'Delete': function() {
                        doDelete();
                        dialog.dialog('close');
                    },
                    'Cancel': function() {
                        dialog.dialog('close');
                    }
                }
            });
        },
        doDelete: function() {
            this.trigger('deleting');
            this.model.destroy().done(this.trigger.bind(this, 'deleted'));
        },
        setToolTip: function() {
            var blockers = _.map(this.model.businessRuleMgr.deleteBlockers, function(__, field) {
                return field;
            });
            this.button.attr('title', blockers.join(', '));
        }
    });
});
