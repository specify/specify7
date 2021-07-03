"use strict";

var $ = require('jquery');
const commonText = require('./localization/common.tsx').default;

    var dialog = null;

    function execute() {
        if (dialog) return;

        var callGenerate = function(evt) {
            evt.preventDefault();
            generate( $('input', this).val() );
        };

        dialog = $(`<div>
            <form>
                <label>${commonText('userPassword')}</label>
                <input type="password">
                <input type="submit" style="display: none;">
            </form>
        </div>`).dialog({
            title: commonText('generateMasterKeyDialogTitle'),
            modal: true,
            close: function() { $(this).remove(); dialog = null;},
            buttons: [
                {text: commonText('generate'), click: callGenerate},
                {text: commonText('cancel'), click: function() { $(this).dialog('close'); }}
            ]
        });
        $('input', dialog).focus();
        $('form', dialog).submit(callGenerate);
    }

    function generate(password) {
        $.post('/api/master_key/', {'password': password})
            .done(gotKey)
            .fail(requestFailed);
    }

    function gotKey(masterKey) {
        dialog.dialog('close');
        dialog = $(`<div>
            <label>${commonText('masterKeyFieldLabel')}</label>
            <input type="text" size="60" readonly>
        </div>`).dialog({
            title: commonText('masterKeyDialogTitle'),
            modal: true,
            width: 'auto',
            close: function() { $(this).remove(); dialog = null; },
            buttons: [
                {text: commonText('close'), click: function() { $(this).dialog('close'); }}
            ]
        });
        dialog.find('input').val(masterKey).focus().select();
    }

    function requestFailed(jqXHR) {
        if (jqXHR.status == 403) {
            alert(commonText('incorrectPassword'));
            jqXHR.errorHandled = true;
        }
    }

module.exports =  {
        task: 'masterkey',
        title: commonText('generateMasterKey'),
        icon: null,
        execute: execute
    };

