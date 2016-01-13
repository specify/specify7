"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');
var template = require('./templates/confirmdelete.html');

module.exports =  Backbone.View.extend({
        __name__: "DeleteButton",
        events: {
            'click .delete-button': 'openDialog'
        },
        initialize: function(options) {
            this.waitDialog = null;
        },
        render: function() {
            this.$el.addClass('deletebutton');
            this.button = $('<input type="button" value="*Delete" class="delete-button">').appendTo(this.el);
            this.promise = $.get('/api/delete_blockers/' +
                                 this.model.specifyModel.name.toLowerCase() +
                                 '/' + this.model.id + '/');
            this.promise.done(this.gotBlockers.bind(this));
            return this;
        },
        gotBlockers: function(blockers) {
            this.blockers = blockers;
            if(blockers.length < 1) {
                this.button.attr("value", "Delete");
            }
        },
        openDialog: function(evt) {
            evt && evt.preventDefault();

            if (this.promise.state() == 'pending') {
                this.waitDialog || this.openWaitDialog();
                this.promise.done(this.openDialog.bind(this, null));
            } else {
                this.waitDialog && this.waitDialog.dialog("close");
                this.blockers.length > 0 ? this.openBlockedDialog() : this.openConfirmDialog();
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
            $('.progress', this.waitDialog).progressbar({ value: false });
        },
        openConfirmDialog: function() {
            var doDelete = this.doDelete.bind(this);

            $(template()).dialog({
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
            var lis = _.map(this.blockers, function(field) {
                return $('<li>').text(field)[0];
            });
            $('ul', dialog).append(lis);
        },
        doDelete: function() {
            this.trigger('deleting');
            this.model.destroy().done(this.trigger.bind(this, 'deleted'));
        }
    });

