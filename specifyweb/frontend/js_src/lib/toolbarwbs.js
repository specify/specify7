'use strict';
const $ = require('jquery');

var schema = require('./schema.js');
var WbsDialog = require('./components/wbsdialog').default;
const commonText = require('./localization/common').default;

module.exports = {
  task: 'workbenches',
  title: commonText('workbench'),
  icon: '/static/img/workbench.png',
  execute() {
    new WbsDialog({ showTemplates: false }).render();
  },
};
