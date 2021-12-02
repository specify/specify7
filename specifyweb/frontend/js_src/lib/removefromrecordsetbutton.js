'use strict';

const $ = require('jquery');
const Backbone = require('./backbone.js');

const formsText = require('./localization/forms').default;
const commonText = require('./localization/common').default;

module.exports = Backbone.View.extend({
  __name__: 'RemoveFromRecordSetButton',
  tagName: 'button',
  events: {
    click: 'click',
  },
  initialize({ model, recordsetId }) {
    this.model = model;
    this.recordsetId = recordsetId;

    this.promptDialog = undefined;

    this.setButtonDisabled(false);

    this.model.on('saverequired', () => this.setButtonDisabled(true), this);
  },
  setButtonDisabled: function (disabled) {
    this.el.disabled = disabled;
  },
  render() {
    this.el.classList.add('remove-from-data-set-button');
    this.el.type = 'button';
    this.el.classList.add('fake-link');
    this.el.title = formsText('removeFromRecordSetButtonDescription');
    this.el.innerHTML = `<span class="ui-icon ui-icon-trash">
      ${formsText('removeFromRecordSetButtonDescription')}
    </span>`;
    return this;
  },
  click() {
    if (this.promptDialog) this.closeDialog();
    else
      this.promptDialog = $(`<div>
            ${formsText('removeRecordFromRecordSetDialogHeader')}
            <p>${formsText('removeRecordFromRecordSetDialogMessage')}</p>
      </div>`).dialog({
        title: formsText('removeRecordFromRecordSetDialogTitle'),
        modal: true,
        buttons: [
          { text: commonText('close'), click: this.closeDialog.bind(this) },
          {
            text: commonText('remove'),
            click: this.removeFromRecordSet.bind(this),
          },
        ],
      });
  },
  closeDialog() {
    this.promptDialog.dialog('destroy');
    this.promptDialog = undefined;
  },
  removeFromRecordSet: function () {
    const resourceUrl = `${this.model.specifyModel.name.toLowerCase()}/${this.model.get(
      'id'
    )}`;
    $.ajax(`/api/specify/${resourceUrl}/?recordsetid=${this.recordsetId}`, {
      type: 'DELETE',
    })
      .done(() => window.location.replace(`/specify/view/${resourceUrl}/`))
      .fail(function (jqXHR) {
        if (jqXHR.status === 409) {
          jqXHR.errorHandled = true;
          $(`<div><p>
            <span
              class="ui-icon ui-icon-alert"
              style="display: inline-block;"
            ></span>
            ${formsText('saveConflictDialogHeader')}
            ${formsText('saveConflictDialogMessage')}
          </p></div>`).dialog({
            title: formsText('saveConflictDialogTitle'),
            resizable: false,
            modal: true,
            dialogClass: 'ui-dialog-no-close',
            buttons: [
              {
                text: commonText('close'),
                click() {
                  window.location.reload();
                },
              },
            ],
          });
        }
      });
  },
});
