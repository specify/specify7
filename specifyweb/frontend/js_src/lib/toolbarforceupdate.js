"use strict";

const $ = require('jquery');
const Q = require('q');

const title = 'Update Feed Now';

var dialog = null;

function execute() {
    if (dialog) return;

    dialog = $('<div>Update all export feed items now?</div>').dialog({
        modal: true,
        title: title,
        close: function() { $(this).remove(); dialog = null; },
        buttons: [
            {text: 'Update', click: startUpdate},
            {text: 'Cancel', click: function() { $(this).dialog('close'); }}
        ]});
}

function startUpdate() {
    $.post('/export/force_update/').done(() => {
        dialog.dialog('close');
        dialog = $(
            '<div>Update started. You will receive a notification for each feed item updated.</div>'
        ).dialog({
            modal: true,
            title: 'Update Started',
            close: function() { $(this).remove(); dialog = null; },
            buttons: [
                {text: 'OK', click: function() { $(this).dialog('close'); }}
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
