define(['jquery', 'jquery-ui'], function($) {
    "use strict";

    var dialog = null;

    function execute() {
        if (dialog) return;

        dialog = $('<div title="Generate Master Key">\n' +
                   '<label>User Password:</label>\n' +
                   '<input type="password">\n' +
                   '</div>').dialog({
                       modal: true,
                       close: function() { $(this).remove(); },
                       buttons: [
                           {text: 'Generate', click: function() { generate( $('input', this).val() ); }},
                           {text: 'Cancel', click: function() { $(this).dialog('close'); dialog = null; }}
                       ]});
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
                       close: function() { $(this).remove(); },
                       buttons: [
                           {text: 'Done', click: function() { $(this).dialog('close'); dialog = null; }}
                       ]});
        dialog.find('input').val(masterKey);
    }

    function requestFailed(jqXHR) {
        if (jqXHR.status == 403) {
            alert("Password was incorrect.");
            jqXHR.errorHandled = true;
        }
    }

    return function(app) {
        app.router.route('master_key/', 'master_key', execute);
    };
});
