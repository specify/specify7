require('../css/wbimport.css');

import React from 'react';
import ReactDOM from 'react-dom';
import WbImport from './components/wbimport';

const app = require('./specifyapp.js');
const Backbone = require('./backbone.js');
const wbText = require('./localization/workbench').default;

const WBImportView = Backbone.View.extend({
  __name__: 'WBImportView',
  className: 'workbench-import-view',
  render() {
    ReactDOM.render(<WbImport />, this.el);
    return this;
  },
});

export default function () {
  app.setTitle(wbText('importDataSet'));
  app.setCurrentView(new WBImportView());
}
