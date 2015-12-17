"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var businessRules    = require('./businessrules.js');
var errorview        = require('./errorview.js');
var HeaderUI         = require('./headerui.js');
var navigation       = require('./navigation.js');

var datatask          = require('./datatask.js');
var querytask         = require('./querytask.js');
var treetask          = require('./treetask.js');
var expresssearchtask = require('./expresssearchtask.js');
var datamodeltask     = require('./datamodeltask.js');
var attachmentstask   = require('./attachmentstask.js');
var wbtask            = require('./wbtask.js');
var wbimporttask      = require('./wbimporttask.js');

var tasks = [
    datatask,
    querytask,
    treetask,
    expresssearchtask,
    datamodeltask,
    attachmentstask,
    wbtask,
    wbimporttask
];


    function handleUnexpectedError(event, jqxhr, settings, exception) {
        if (jqxhr.errorHandled) return; // Not unexpected.
        if (jqxhr.status === 403) {
            $('<div title="Insufficient Privileges">'
              + 'You lack sufficient privileges for that action, '
              + 'or your current session has been logged out.</div>')
                .appendTo('body').dialog({
                    modal: true,
                    open: function(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); },
                    buttons: [{
                        text: 'Login',
                        click: function() {
                            window.location = "/accounts/login/?next=" + window.location.href;
                        }
                    }]});
            return;
        }
        new errorview.UnhandledErrorView({jqxhr: jqxhr}).render();

        console.log(arguments);
    }

    module.exports = function appStart() {
        console.info('specify app starting');
        // addBasicRoutes(router);
        $(document).ajaxError(handleUnexpectedError);
        businessRules.enable(true);
        new HeaderUI().render();
        _.each(tasks, function(task) { task(); });

        // start processing the urls to draw the corresponding views
        Backbone.history.start({pushState: true, root: '/specify/'});

        $('body').delegate('a.intercept-navigation', 'click', function(evt) {
            evt.preventDefault();
            var href = $(evt.currentTarget).prop('href');
            href && navigation.go(href);
        });
    };
