import $ from 'jquery';
import uniquifyDataSetName from './wbuniquifyname';
import Backbone from './backbone';
import {setTitle} from './specifyapp';
import {format} from './dataobjformatters';
import schema from './schema';
import resourceApi from './resourceapi';
import * as navigation from './navigation';
import userInfo from './userinfo';
import wbText from './localization/workbench';
import commonText from './localization/common';
import React from 'react';
import {formatNumber, getRelativeDate} from "./components/internationalization";
import {LANGUAGE} from "./localization/utils";

// TODO: rewrite this to react
function dateElement(date, fallback = '') {
  if (typeof date !== 'string' || Number.isNaN(Date.parse(date)))
    return fallback;
  const dateObject = new Date(date);
  return `<time
    datetime="${dateObject.toISOString()}"
    title="${dateObject.toLocaleString(LANGUAGE)}"
  >
    ${getRelativeDate(dateObject)}
  </time>`;
}

export const DataSetMeta = Backbone.View.extend({
  __name__: 'DataSetMetaView',
  initialize({ dataset, getRowCount, onClose, isOpen = true }) {
    this.dataset = dataset;
    this.dialog = null;
    this.model = schema.models.Agent;
    this.createdByAgent = null;
    this.modifiedByAgent = null;
    this.changeOwnerDialog = null;
    this.listOfUsers = null;
    this.getRowCount = getRowCount ?? (() => dataset.rows.length);
    this.handleClose = onClose;
    this.isOpen = isOpen;
  },
  render() {
    if (this.dialog !== null) this.remove();
    else if (this.isOpen) this.startEditing();
  },
  remove() {
    if (this.dialog === null) return;
    this.dialog.remove();
    this.dialog = null;
    if (this.handleClose) this.handleClose();
  },
  fetchAgent(agentString) {
    return new Promise((resolve) => {
      if (agentString === null) resolve(null);
      const agentId = resourceApi.idFromUrl(agentString);
      const createdByAgentResource = new this.model.Resource({
        id: agentId,
      });
      format(createdByAgentResource).done((formattedAgent) =>
        resolve(
          `<a
          class="intercept-navigation"
          href="${createdByAgentResource.viewUrl()}"
        >${formattedAgent}</a>`
        )
      );
    });
  },
  loadAgentInfo(createdByField, modifiedByField) {
    if (this.createdByAgent !== null) {
      this.showAgentInfo(createdByField, modifiedByField);
      return;
    }

    const sameAgent =
      this.dataset.createdbyagent === this.dataset.modifiedbyagent;
    const createdByAgent = this.fetchAgent(this.dataset.createdbyagent);
    const modifiedByAgent = sameAgent
      ? Promise.resolve()
      : this.fetchAgent(this.dataset.modifiedbyagent);

    Promise.all([createdByAgent, modifiedByAgent]).then(
      ([createdByAgent, modifiedByAgent]) => {
        this.createdByAgent = createdByAgent;
        this.modifiedByAgent = sameAgent ? createdByAgent : modifiedByAgent;
        this.showAgentInfo(createdByField, modifiedByField);
      }
    );
  },
  showAgentInfo(createdByField, modifiedByField) {
    createdByField.html(this.createdByAgent ?? commonText('notFound'));
    modifiedByField.html(this.modifiedByAgent ?? commonText('notFound'));
  },
  startEditing() {
    if (this.dialog !== null) return;

    this.dialog = $(`<div>
      <label>
        <b>${wbText('dataSetName')}</b>
        <input
          type="text"
          style="
            display: block;
            width: 100%
          "
          class="dataset-name"
          value="${this.dataset.name}"
          spellcheck="true"
        >
      </label>
      <br>
      <label>
        <b>${wbText('remarks')}</b>
        <textarea
          style="width: 100%"
          class="dataset-remarks"
        >${this.dataset.remarks ?? ''}</textarea>
      </label><br><br>
      <b>${commonText('metadataInline')}</b><br>
      ${wbText('numberOfRows')} <i>${formatNumber(this.getRowCount())}</i><br>
      ${wbText('numberOfColumns')} <i>${formatNumber(this.dataset.columns.length)}</i><br>
      ${wbText('created')} <i>${dateElement(
      this.dataset.timestampcreated
    )}</i><br>
      ${wbText('modified')} <i>${dateElement(
      this.dataset.timestampmodified
    )}</i><br>
      ${wbText('uploaded')} <i>${dateElement(
      this.dataset.uploadresult?.success,
      commonText('no')
    )}</i><br>
      ${commonText('createdBy')} <i class="created-by-field">
        ${commonText('loading')}
      </i><br>
      ${commonText('modifiedBy')} <i class="modified-by-field">
        ${commonText('loading')}
      </i><br>
      ${wbText('importedFileName')} <i>${
      this.dataset.importedfilename || wbText('noFileName')
    }</i><br>
    </div>`).dialog({
      title: wbText('dataSetMetaDialogTitle'),
      modal: true,
      close: () => this.render(),
      buttons: {
        [commonText('cancel')]: () => this.render(),
        [commonText('save')]: this.setName.bind(this, this.render.bind(this)),
      },
    });

    this.dialog
      .find('.change-data-set-owner')
      .on('click', this.setName.bind(this, this.changeOwnerWindow.bind(this)));
    this.dialog.find('.export-data-set').on('click', this.handleExport);
    this.dialog.find('.delete-data-set').on('click', this.handleDelete);

    this.loadAgentInfo(
      this.dialog.find('.created-by-field'),
      this.dialog.find('.modified-by-field')
    );
  },
  setName(callback) {
    if (this.dialog === null) return;

    const [newName, newRemarks] = ['.dataset-name', '.dataset-remarks']
      .map((fieldClassName) => this.dialog.find(fieldClassName).val().trim())
      .map((value) => (value === '' ? null : value));

    if (
      newName === this.dialog.name &&
      newRemarks === this.dialog.remarks.toString()
    )
      callback();
    else {
      uniquifyDataSetName(newName, this.dataset.id).done((uniqueName) => {
        $.ajax(`/api/workbench/dataset/${this.dataset.id}/`, {
          type: 'PUT',
          data: JSON.stringify({ name: uniqueName, remarks: newRemarks }),
          contentType: 'application/json',
          processData: false,
        }).done(() => {
          this.dataset.name = uniqueName;
          this.dataset.remarks = newRemarks;
          callback();
        });
      });
    }
  },
  fetchListOfUsers() {
    return new Promise((resolve) =>
      this.listOfUsers === null
        ? fetch('/api/specify/specifyuser/?limit=500')
            .then((response) => response.json())
            .then(({ objects: users }) =>
              resolve(
                (this.listOfUsers = users
                  .map((user) => ({
                    id: user.id,
                    name: user.name,
                  }))
                  .filter(({ id }) => id !== userInfo.id))
              )
            )
        : resolve(this.listOfUsers)
    );
  },
  changeOwnerWindow() {
    this.fetchListOfUsers().then((users) => {
      this.changeOwnerDialog = $(`<div>
        ${wbText('changeDataSetOwnerDialogHeader')}
        <label>
          <p>${wbText('changeDataSetOwnerDialogMessage')}</p>
          <select class="select-user-picklist" size="10" style="width:100%">
            ${users
              .map(
                (user) => `<option value="${user.id}">
              ${user.name}
            </option>`
              )
              .join('<br>')}
          </select>
        </label>
      </div>`).dialog({
        title: wbText('changeDataSetOwnerDialogTitle'),
        modal: true,
        close: () => this.changeOwnerDialog.dialog('destroy'),
        buttons: {
          [commonText('cancel')]: () =>
            this.changeOwnerDialog.dialog('destroy'),
          [wbText('changeOwner')]: this.changeOwner.bind(this),
        },
      });
    });
  },
  changeOwner() {
    const selectedOwner = this.changeOwnerDialog
      .find('.select-user-picklist')
      .val();
    if (!selectedOwner) return;
    $.post(`/api/workbench/transfer/${this.dataset.id}/`, {
      specifyuserid: selectedOwner,
    })
      .done(() => {
        const handleClose = () => navigation.go('/specify/');
        $(`<div>
          ${wbText('dataSetOwnerChangedDialogHeader')}
          <p>${wbText('dataSetOwnerChangedDialogMessage')}</p>
        </div>`).dialog({
          title: wbText('dataSetOwnerChangedDialogTitle'),
          modal: true,
          close: handleClose,
          buttons: {
            [commonText('close')]: handleClose,
          },
        });
      })
      .fail((error) => {
        throw error;
      });
  },
});

// A wrapper for DS Meta for embedding in the WB
export default Backbone.View.extend({
  __name__: 'DataSetNameView',
  events: {
    'click .wb-metadata': 'startEditing',
  },
  initialize({ dataset, getRowCount, onClose }) {
    this.dataset = dataset;
    this.dataSetMeta = new DataSetMeta({
      dataset,
      getRowCount,
      onClose: () => {
        this.handleRename();
        onClose?.();
      },
      isOpen: false,
    });
  },
  handleRename() {
    const isUploaded =
      this.dataset.uploadresult !== null && this.dataset.uploadresult.success;
    this.$el.find('.wb-name-container').html(`
      <h2 class="wb-name">${wbText('dataSet')} ${this.dataset.name}
        ${
          isUploaded
            ? `<span style="color: #f24">
                ${wbText('dataSetUploadedLabel')}
              </span>`
            : ''
        }
      </h2>
      <button
          type="button"
          class="wb-metadata magic-button"
      >${commonText('metadata')}</button>
    `);
    setTitle(this.dataset.name);
  },
  render() {
    this.dataSetMeta.render();
    this.handleRename();
    return this;
  },
  startEditing() {
    this.dataSetMeta.startEditing();
  },
});
