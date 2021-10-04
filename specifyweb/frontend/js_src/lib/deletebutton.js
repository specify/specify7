"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

const commonText = require('./localization/common').default;
const formsText = require('./localization/forms').default;

module.exports =  Backbone.View.extend({
        __name__: "DeleteButton",
        events: {
            'click .delete-button': 'openDialog'
        },
        initialize: function({model, warning}) {
            this.model = model;
            this.warning = warning;

            this.waitDialog = null;
        },
        render: function() {
            this.$el.addClass('deletebutton');
            this.button = $(`<a
              href="#"
              class="delete-button"
              style="display:inline-flex;"
            >
              ${commonText('delete')} 
            </a>`).appendTo(this.el);
            this.promise = $.get('/api/delete_blockers/' +
                                 this.model.specifyModel.name.toLowerCase() +
                                 '/' + this.model.id + '/');
            this.promise.done(this.gotBlockers.bind(this));
            return this;
        },
        gotBlockers: function(blockers) {
            this.blockers = blockers;
            if(blockers.length !== 0)
              this.button[0].innerHTML = `
                <span
                  class="ui-icon ui-icon-alert"
                  style="display: inline-block;"
                ></span>
                ${commonText('delete')}
              `;
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
            this.waitDialog = $(`<div>
                <p>${formsText('checkingIfResourceCanBeDeleted')}</p>
                <div class="progress"></div>
            </div>`).dialog({
                title: commonText('loading'),
                close: function() { $(this).remove(); _this.waitDialog = null;},
                modal: true
                                });
            $('.progress', this.waitDialog).progressbar({ value: false });
        },
        openConfirmDialog: function() {
            var doDelete = this.doDelete.bind(this);

            $(`<div>
                ${formsText('deleteConfirmationDialogHeader')}
                <p>${
                    this.warning ?? formsText('deleteConfirmationDialogMessage')
               }</p>
            </div>`).dialog({
                title: formsText('deleteConfirmationDialogTitle'),
                resizable: false,
                close: function() { $(this).remove(); },
                modal: true,
                buttons: {
                    [commonText('delete')]: function() {
                        doDelete();
                        $(this).dialog('close');
                    },
                    [commonText('cancel')]: function() {
                        $(this).dialog('close');
                    }
                }
            });
        },
        openBlockedDialog: function() {
            var dialog = $(`<div>
               ${formsText('deleteBlockedDialogHeader')}
               <p>${formsText('deleteBlockedDialogMessage')}</p>
               <ul></ul>
            </div>`).dialog({
               title: formsText('deleteBlockedDialogTitle'),
               close: function() { $(this).remove(); },
               modal: true
            });
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

