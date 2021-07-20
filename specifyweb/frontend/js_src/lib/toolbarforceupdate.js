"use strict";

const $ = require('jquery');
const Q = require('q');
const commonText = require('./localization/common').default;


var dialog = null;

function execute() {
    if (dialog) return;

    dialog = $(`<aside>
        ${commonText('updateExportFeedDialogHeader')}
        <p>${commonText('updateExportFeedDialogMessage')}</p>
    </aside>`).dialog({
        modal: true,
        title: commonText('updateExportFeedDialogTitle'),
        close: function() { $(this).remove(); dialog = null; },
        buttons: [
            {text: commonText('update'), click: startUpdate},
            {text: commonText('cancel'), click: function() { $(this).dialog('close'); }}
        ]});
}

function startUpdate() {
    $.post('/export/force_update/').done(() => {
        dialog.dialog('close');
        dialog = $(`<aside>
            ${commonText('feedExportStartedDialogHeader')}
            <p>${commonText('feedExportStartedDialogMessage')}</p>
        </aside>`).dialog({
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
    title: commonText('updateExportFeed'),
    icon: null,
    execute: execute,
    disabled: user => !user.isadmin
};
