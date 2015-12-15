define([
    'jquery', 'underscore', 'backbone', 'businessrules', 'userinfo',
    'errorview', 'welcomeview', 'headerui', 'notfoundview', 'navigation',
    'resourceview', 'initialcontext', 'router', 'systeminfo'
], function (
    $, _, Backbone, businessRules, userInfo, errorview,
    WelcomeView, HeaderUI, NotFoundView, navigation,
    ResourceView, initialContext, router, systemInfo) {
    "use strict";

    var currentView;
    var versionMismatchWarned = false;

    // get a reference to the content div
    // where we will draw the rest of the app
    var rootContainer = $('#content');

    // setup basic routes.
    router
        .route('*whatever', 'notFound', function() {
            app.setCurrentView(new NotFoundView());
            app.setTitle('Page Not Found');
        })
        .route('', 'welcome', function() {
            app.setCurrentView(new WelcomeView());
            app.setTitle('Welcome');
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
        rootContainer.empty();
        $('.ui-autocomplete').remove(); // these are getting left behind sometimes
        $('.ui-dialog-content').dialog('close'); // close any open dialogs
        currentView = view;
        currentView.render();
        rootContainer.append(currentView.el);

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
        var view = new ResourceView({ model: resource, recordSet: recordSet, mode: viewMode });

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
        router: router, //new SpecifyRouter(),
        handleError: handleError,
        setCurrentView: setCurrentView,
        showResource: showResource,
        setTitle: setTitle,
        getCurrentView: function() { return currentView; }  // a reference to the current view

    };

    return app;
});
