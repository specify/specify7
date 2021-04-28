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
        ? `<p>No Data Sets present. Use the "Import" button to import data</p>`
        : `<table class="wb-ds-dialog-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Uploaded</th>
            <th>Created</th>
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
    const dateCreated = new Date(dataset.timestampcreated);

    return `<tr>
      <td>
        <a href="/workbench/${dataset.id}/" class="intercept-navigation">
          <img src="/images/Workbench32x32.png" alt="">
          ${dataset.name}
        </a>
      </td>
      <td>[TODO]</td>  <!-- TODO: add date uploaded-->
      <td
        title="${dateCreated.toLocaleString()}"
      >${dateCreated.toDateString()}</td>
    </tr>`;
  },
});
