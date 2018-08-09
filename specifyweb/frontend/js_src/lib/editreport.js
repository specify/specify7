"use strict";

const $ = require('jquery');

module.exports = function editReport({appResourceData}) {
    const textarea = $('<textarea cols="120" rows="40" spellcheck="false">').text(appResourceData.get('data'));
    const dialog = $('<div>').append(textarea).dialog({
        title: 'Edit Report',
        width: 'auto',
        buttons: {
            Save() {
                appResourceData.set('data', textarea.val());
                appResourceData.save().done(() => $(this).dialog('close'));
                saveButton.button('disable');
            },
            Cancel() { $(this).dialog('close'); }
        }
    });

    const saveButton = dialog.next(".ui-dialog-buttonpane").find("button:contains('Save')");
    saveButton.button('disable');

    textarea.on('input', () => saveButton.button('enable'));
};
