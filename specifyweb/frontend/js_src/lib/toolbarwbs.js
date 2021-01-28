"use strict";
const $ = require('jquery');

var schema      = require('./schema.js');
var WbsDialog   = require('./wbsdialog.js');
var userInfo    = require('./userinfo.js');

module.exports =  {
    task: 'workbenches',
    title: 'WorkBench',
    icon: '/static/img/workbench.png',
    execute() {
        $.get('/api/workbench/dataset/').done(dss => {
            new WbsDialog({ datasets: dss, readOnly: userInfo.isReadOnly }).render();
        });
    }
};

