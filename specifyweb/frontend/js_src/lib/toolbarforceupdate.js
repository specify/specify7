"use strict";

const $ = require('jquery');
const Q = require('q');
const commonText = require('./localization/common.tsx').default;

const title = commonText('updateExportFeedDialogTitle');

var dialog = null;

function execute() {
    if (dialog) return;

    dialog = $(`<div>${commonText('updateExportFeedDialogMessage')}</div>`).dialog({
        modal: true,
        title: title,
        close: function() { $(this).remove(); dialog = null; },
        buttons: [
            {text: commonText('update'), click: startUpdate},
            {text: commonText('cancel'), click: function() { $(this).dialog('close'); }}
        ]});
}

function startUpdate() {
    $.post('/export/force_update/').done(() => {
        dialog.dialog('close');
        dialog = $(`<div>${commonText('feedExportStartedDialogMessage')}</div>`).dialog({
            modal: true,
            title: commonText('feedExportStartedDialogTitle'),
            close: function() { $(this).remove(); dialog = null; },
            buttons: [
                {text: commonText('close'), click: function() { $(this).dialog('close'); }}
            ]});

    });
}

module.exports = {
    task: 'forceupdatefeed',
    title: title,
    icon: null,
    execute: execute,
    disabled: user => !user.isadmin
};
