import '../css/wbimport.css';

import React from 'react';
import ReactDOM from 'react-dom';
import WbImport from './components/wbimport';

import * as app from './specifyapp';
import Backbone from './backbone';
import wbText from './localization/workbench';

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
