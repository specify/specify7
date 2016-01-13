"use strict";

var $ = require('jquery');

    var dialog = null;

    function execute() {
        if (dialog) return;

        var callGenerate = function(evt) {
            evt.preventDefault();
            generate( $('input', this).val() );
        };

        dialog = $('<div title="Generate Master Key">\n' +
                   '<form>\n' +
                   '<label>User Password:</label>\n' +
                   '<input type="password">\n' +
                   '<input type="submit" style="display: none;">\n' +
                   '</form>\n' +
                   '</div>').dialog({
                       modal: true,
                       close: function() { $(this).remove(); dialog = null;},
                       buttons: [
                           {text: 'Generate', click: callGenerate},
                           {text: 'Cancel', click: function() { $(this).dialog('close'); }}
                       ]});
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
        dialog = $('<div title="Master Key">\n' +
                   '<label>Master Key:</label>\n' +
                   '<input type="text" size="60" readonly>\n' +
                   '</div>').dialog({
                       modal: true,
                       width: 'auto',
                       close: function() { $(this).remove(); dialog = null; },
                       buttons: [
                           {text: 'Done', click: function() { $(this).dialog('close'); }}
                       ]});
        dialog.find('input').val(masterKey).focus().select();
    }

    function requestFailed(jqXHR) {
        if (jqXHR.status == 403) {
            alert("Password was incorrect.");
            jqXHR.errorHandled = true;
        }
    }

module.exports =  {
        task: 'masterkey',
        title: 'Generate Master Key',
        icon: null,
        execute: execute
    };

