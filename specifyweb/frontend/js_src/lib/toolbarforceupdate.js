"use strict";

import $ from 'jquery';
import commonText from './localization/common';


var dialog = null;

function execute() {
    if (dialog) return;

    dialog = $(`<div>
        ${commonText('updateExportFeedDialogHeader')}
        ${commonText('updateExportFeedDialogMessage')}
    </div>`).dialog({
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
        dialog = $(`<div>
            ${commonText('feedExportStartedDialogHeader')}
            ${commonText('feedExportStartedDialogMessage')}
        </div>`).dialog({
            modal: true,
            title: commonText('feedExportStartedDialogTitle'),
            close: function() { $(this).remove(); dialog = null; },
            buttons: [
                {text: commonText('close'), click: function() { $(this).dialog('close'); }}
            ]});

    });
}

export default {
    task: 'forceupdatefeed',
    title: commonText('updateExportFeed'),
    icon: null,
    execute: execute,
    disabled: user => !user.isadmin
};
