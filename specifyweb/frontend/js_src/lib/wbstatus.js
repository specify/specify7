'use strict';

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('./backbone.js');

const statusTemplate = require('./templates/wbstatus.html');

const refreshTime = 2000;

module.exports = Backbone.View.extend({
  __name__: 'WBStatus',
  className: 'wb-status',
  initialize({ dataset }) {
    this.dataset = dataset;
    this.stopStatusRefresh = false;
  },
  render() {
    const stopRefresh = () => (this.stopStatusRefresh = true);

    this.$el.append(statusTemplate(this.dataset.uploaderstatus)).dialog({
      modal: true,
      title: 'Workbench Status',
      open(evt, ui) {
        $('.ui-dialog-titlebar-close', ui.dialog).hide();
      },
      close() {
        $(this).remove();
        stopRefresh();
      },
      buttons: [
        {
          text: 'Stop',
          click: () => {
            $.post(`/api/workbench/abort/${this.dataset.id}/`);
          },
        },
      ],
    });

    if (this.status) this.initializeProgressBar();

    window.setTimeout(() => this.refresh(), refreshTime);

    return this;
  },
  refresh() {
    $.get(`/api/workbench/status/${this.dataset.id}/`).done((status) => {
      this.dataset.uploaderstatus = status;

      if (this.stopStatusRefresh) {
        return;
      } else {
        window.setTimeout(() => this.refresh(), refreshTime);
      }

      if (status == null) {
        this.stopStatusRefresh = true;
        this.$el.dialog('close');
        this.trigger('done');
      } else {
        this.$el.empty().append(statusTemplate({ status: status }));
        this.initializeProgressBar();
      }
    });
  },
  initializeProgressBar() {
    if (this.dataset.uploaderstatus.taskstatus !== 'PROGRESS') return;

    const { total, current } = this.dataset.uploaderstatus.taskinfo;
    const progressBar = this.$el.find('.wb-status-progress-bar');

    if (progressBar.length !== 0)
      progressBar.progressbar({
        value: current,
        max: total,
      });
  },
});
