"use strict";

var $ = require('jquery');

global.jQuery = $;
require('jquery-contextmenu');
require('jquery-ui');

var userInfo     = require('./userinfo.js');
var populateForm = require('./populateform.js');
var errorview    = require('./errorview.js');
var NotFoundView = require('./notfoundview.js');
var navigation   = require('./navigation.js');
var ResourceView = require('./resourceview.js');
var router       = require('./router.js');
var systemInfo   = require('./systeminfo.js');

    var currentView;
    var versionMismatchWarned = false;

    // setup basic routes.
    router
        .route('*whatever', 'notFound', function() {
            app.setCurrentView(new NotFoundView());
            app.setTitle('Page Not Found');
        })
        .route('test_error/', 'testError', function() {
            $.get('/api/test_error/');
        });

    // Stop jquery-ui dialog from autofocusing first tabbable element.
    $.ui.dialog.prototype._focusTabbable = function(){};

    // gets rid of any backbone view currently showing
    // and replaces it with the rendered view given
    // also manages other niceties involved in changing views
    function setCurrentView(view) {
        currentView && currentView.remove(); // remove old view
        $('#content').empty();
        $('.ui-autocomplete').remove(); // these are getting left behind sometimes
        $('.ui-dialog-content').dialog('close'); // close any open dialogs
        currentView = view;
        currentView.render();
        $('#content').append(currentView.el);

        if (systemInfo.specify6_version !== systemInfo.database_version && !versionMismatchWarned) {
            $('<div title="Version Mismatch">' +
              '<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 50px 0;"></span>' +
              'The Specify version (' + systemInfo.specify6_version + ') ' +
              'does not match the database version (' + systemInfo.database_version + ').</p>' +
              '<p>Some features of Specify 7 may therefore fail to operate correctly.</p>' +
              '</div>').dialog({ modal: true });
            versionMismatchWarned = true;
        }
    }

    function handleError(jqxhr) {
        setCurrentView(new errorview.ErrorView({ request: jqxhr }));
        jqxhr.errorHandled = true;
    }

    // build and display view for resource
    function showResource(resource, recordSet, pushUrl) {
        var viewMode = userInfo.isReadOnly ? 'view' : 'edit';
        var view = new ResourceView({ populateForm: populateForm, model: resource, recordSet: recordSet, mode: viewMode });

        view.on('saved', function(resource, options) {
            if (options.addAnother) {
                showResource(options.newResource, recordSet);
            } else if (options.wasNew) {
                navigation.go(resource.viewUrl());
            } else {
                showResource(new resource.constructor({ id: resource.id }), recordSet);
            }
        }).on('deleted', function() {
            if (view.next) {
                navigation.go(view.next.viewUrl());
            } else if (view.prev) {
                navigation.go(view.prev.viewUrl());
            } else {
                view.$el.empty();
                view.$el.append('<p>Item deleted.</p>');
            }
        }).on('changetitle', function(resource, title) {
            setTitle(title);
        });

        pushUrl && navigation.push(resource.viewUrl());
        setCurrentView(view);
    }

    //set title of browser tab
    function setTitle(title) {
        window.document.title = title + " | Specify 7";
    }

    // the exported interface
    var app = {
        handleError: handleError,
        setCurrentView: setCurrentView,
        showResource: showResource,
        setTitle: setTitle,
        getCurrentView: function() { return currentView; }  // a reference to the current view
    };

module.exports =  app;

