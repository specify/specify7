
require('../css/wbimport.css');

import React from 'react';
import ReactDOM from 'react-dom';
import WbImport from './components/wbimport';

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('./backbone.js');
const Q = require('q');

const schema = require('./schema.js');
const navigation = require('./navigation.js');
const app = require('./specifyapp.js');
const uniquifyWorkbenchName = require('./wbuniquifyname.js');
const userInfo = require('./userinfo.js');


const WBImportView = Backbone.View.extend({
    __name__: "WBImportView",
    className: 'workbench-import-view',
    render: function() {
        ReactDOM.render(<WbImport doImport={doImport} />, this.el);
        return this;
    }
});

function doImport(name, header, data) {
    const dialog = $('<div><div class="progress-bar"></div></div>').dialog({
        title: 'Importing',
        modal: true,
        open: function(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); },
        close: function() {$(this).remove();}
    });
    $('.progress-bar', dialog).progressbar({value: false});

    const template = new schema.models.WorkbenchTemplate.Resource({
        specifyuser: userInfo.resource_uri,
        workbenchtemplatemappingitems: header.map(
            (column, i) => new schema.models.WorkbenchTemplateMappingItem.Resource({
                caption: column,
                fieldname: column,
                vieworder: i,
                origimportcolumnindex: i
            })
        )
    });
    template.set('name', name);

    const workbench = new schema.models.Workbench.Resource({
        name: name,
        workbenchtemplate: template,
        specifyuser: userInfo.resource_uri,
        srcfilepath: ""
    });

    Q(workbench.save())
        .then(
            () => Q($.ajax('/api/workbench/rows/' + workbench.id + '/', {
                data: JSON.stringify(data.map(row => [null].concat(row))),
                type: "PUT"
            }))
        ).done(() => {
            dialog.dialog('close');
            navigation.go('/workbench/' + workbench.id + '/');
        });
}


export default function() {
    app.setTitle("Import Dataset");
    app.setCurrentView(new WBImportView());
};

