define(['jquery', 'underscore', 'backbone', 'templates'], function($, _, Backbone, templates) {
    "use strict";

    return Backbone.View.extend({
        __name__: "DeleteButton",
        events: {
            'click .delete-button': 'openDialog'
        },
        initialize: function(options) {
            this.blocked = true;
            this.model.on('candelete', function() {
                this.blocked = false;
                this.button.attr("value", "Delete");
            }, this);

            this.model.on('deleteblocked', function() {
                this.blocked = true;
                this.button.attr("value", "Delete ⚠");
            }, this);
        },
        render: function() {
            this.$el.addClass('deletebutton');
            this.button = $('<input type="button" value="Delete ⚠" class="delete-button">').appendTo(this.el);
            this.model.businessRuleMgr.checkCanDelete();
            return this;
        },
        openDialog: function(evt) {
            evt.preventDefault();
            this.blocked ? this.openBlockedDialog() : this.openConfirmDialog();
        },
        openConfirmDialog: function() {
            var doDelete = this.doDelete.bind(this);

            $(templates.confirmdelete()).dialog({
                resizable: false,
                close: function() { $(this).remove(); },
                modal: true,
                buttons: {
                    'Delete': function() {
                        doDelete();
                        $(this).dialog('close');
                    },
                    'Cancel': function() {
                        $(this).dialog('close');
                    }
                }
            });
        },
        openBlockedDialog: function() {
            var dialog = $('<div title="Delete Blocked">' +
	                   '<p><span class="ui-icon ui-icon-alert" style="display: inline-block;"></span>' +
                           'The resource cannot be deleted because it is referenced through the following fields:</p>' +
                           '<ul></ul></div>').dialog();
            var model = this.model.specifyModel;
            var lis = _.map(this.model.businessRuleMgr.deleteBlockers, function(__, field) {
                return $('<li>').text(model.getField(field).getLocalizedName() || field)[0];
            });
            $('ul', dialog).append(lis);
        },
        doDelete: function() {
            this.trigger('deleting');
            this.model.destroy().done(this.trigger.bind(this, 'deleted'));
        }
    });
});
