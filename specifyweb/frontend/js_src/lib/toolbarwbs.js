'use strict';
const $ = require('jquery');

var schema = require('./schema.js');
var WbsDialog = require('./components/wbsdialog.tsx').default;

module.exports = {
  task: 'workbenches',
  title: 'WorkBench',
  icon: '/static/img/workbench.png',
  execute() {
    new WbsDialog({ showTemplates: false }).render();
  },
};
