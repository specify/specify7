define(['jquery', 'underscore', 'backbone', 'templates'], function($, _, Backbone, templates) {
    "use strict";

    return Backbone.View.extend({
        __name__: "DeleteButton",
        events: {
            'click .delete-button': 'openDialog'
        },
        initialize: function(options) {
            this.blocked = true;
            this.needCheck = false;
            this.waitDialog = null;

            this.model.on('candelete', function() {
                this.blocked = false;
                this.needCheck = false;
                this.button.attr("value", "Delete");
            }, this);

            this.model.on('deleteblocked', function() {
                this.blocked = true;
                this.button.attr("value", "*Delete");
            }, this);

            this.model.on('removingdeleteblocker', function() {
                if (!this.waitDialog) return;
                var pb = this.waitDialog && $('.progress', this.waitDialog);
                var max = pb.progressbar('option', 'max');
                pb.progressbar({
                    value: max - this.model.businessRuleMgr.getDeleteBlockers().length
                });
            }, this);
        },
        render: function() {
            this.$el.addClass('deletebutton');
            this.button = $('<input type="button" value="*Delete" class="delete-button">').appendTo(this.el);
            if (this.model.businessRuleMgr.getDeleteBlockers().length > 5) {
                this.needCheck = true;
            } else {
                this.model.businessRuleMgr.checkCanDelete();
            }
            return this;
        },
        checkCanDelete: function() {
            this.model.businessRuleMgr.checkCanDelete().done(function() {
                this.needCheck = false;
                _.defer(this.openDialog.bind(this));
            }.bind(this));
        },
        openDialog: function(evt) {
            evt && evt.preventDefault();
            if (this.needCheck) {
                this.openWaitDialog();
                _.defer(this.checkCanDelete.bind(this));
            } else {
                this.waitDialog && this.waitDialog.dialog('close');
                this.blocked ? this.openBlockedDialog() : this.openConfirmDialog();
            }
        },
        openWaitDialog: function() {
            var _this = this;
            this.waitDialog && this.waitDialog.dialog('close');
            this.waitDialog = $('<div title="Wait">' +
                                '<p>Checking if resource can be deleted.</p>' +
                                '<div class="progress"></div></div>').dialog({
                                    close: function() { $(this).remove(); _this.waitDialog = null;},
                                    modal: true
                                });
            $('.progress', this.waitDialog).progressbar({ value: 0, max: this.model.businessRuleMgr.getDeleteBlockers().length });
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
                           '<ul></ul></div>').dialog({
                               close: function() { $(this).remove(); },
                               modal: true
                           });
            var model = this.model.specifyModel;
            var lis = _.map(this.model.businessRuleMgr.getDeleteBlockers(), function(rel) {
                return $('<li>').text(rel.model.getLocalizedName() + '.' + rel.getLocalizedName())[0];
            });
            $('ul', dialog).append(lis);
        },
        doDelete: function() {
            this.trigger('deleting');
            this.model.destroy().done(this.trigger.bind(this, 'deleted'));
        }
    });
});
