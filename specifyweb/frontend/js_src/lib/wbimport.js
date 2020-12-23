
require('../css/wbimport.css');

import React from 'react';
import ReactDOM from 'react-dom';
import WbImport from './components/wbimport';

const app = require('./specifyapp.js');
const Backbone = require('./backbone.js');

const WBImportView = Backbone.View.extend({
    __name__: "WBImportView",
    className: 'workbench-import-view',
    render: function() {
        ReactDOM.render(<WbImport />, this.el);
        return this;
    }
});


export default function() {
    app.setTitle("Import Dataset");
    app.setCurrentView(new WBImportView());
};

