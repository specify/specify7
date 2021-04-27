'use strict';

const $ = require('jquery');
const Backbone = require('./backbone.js');
const navigation = require('./navigation.js');

require('../css/wbdsdialog.css');

module.exports = Backbone.View.extend({
  __name__: 'WbsDialog',
  className: 'wbs-dialog table-list-dialog',
  initialize({ datasets }) {
    this.datasets = datasets;
  },
  render() {
    $(
      this.datasets.length === 0
        ? `<p>No data sets present. Use the "Import" button to import data</p>`
        : `<table class="wb-ds-dialog-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Upload</th>
            <th>Date Created</th>
            <th>Owner</th>
          </tr>
        </thead>
        <tbody>
          ${this.datasets.map(this.datasetToHTML).join('')}
        </tbody>
      </table>`
    ).appendTo(this.el);
    this.$el.dialog({
      title: 'Data Sets',
      maxHeight: 400,
      width: 600,
      modal: true,
      close() {
        $(this).remove();
      },
      buttons: [
        {
          text: 'Import',
          click() {
            navigation.go('/workbench-import/');
          },
        },
        {
          text: 'Cancel',
          click() {
            $(this).dialog('close');
          },
        },
      ],
    });
    return this;
  },
  datasetToHTML(dataset) {
    const state =
      dataset.uploadresult === null
        ? 'un-uploaded'
        : dataset.uploadresult.success
        ? 'uploaded'
        : 'has-upload-error';

    const uploadedStates = {
      'un-uploaded': '',
      uploaded: 'Success',
      'has-upload-error': '',
    };

    return `<tr class="wb-ds-dialog-status-${state}">
      <td>
        <a href="/workbench/${dataset.id}/">
          <img src="/images/Workbench32x32.png" alt="">
          ${dataset.name}
        </a>
      </td>
      <td>${uploadedStates[state]}</td>
      <td>${new Date(dataset.timestampcreated).toLocaleString()}</td>
      <td>[TODO]</td>
    </tr>`;
  },
});
