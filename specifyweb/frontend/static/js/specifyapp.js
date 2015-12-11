define([
    'jquery', 'underscore', 'backbone', 'businessrules',
    'errorview', 'welcomeview', 'headerui', 'notfoundview', 'navigation',
    'resourceview', 'initialcontext',
// Tasks
    'datatask',
    'querytask',
    'treetask',
    'expresssearchtask',
    'datamodeltask',
    'attachmentstask',
    'wbtask',
    'wbimporttask'
], function module(
    $, _, Backbone, businessRules, errorview,
    WelcomeView, HeaderUI, NotFoundView, navigation,
    ResourceView, initialContext) {
    // userJSON, systemInfoJSON) {
    "use strict";
    var tasks = _(arguments).tail(module.length);

    var currentView;
    var versionMismatchWarned = false;

    // get a reference to the content div
    // where we will draw the rest of the app
    var rootContainer = $('#content');

    // make the Backbone routing mechanisms ignore queryparams in urls
    // this gets rid of all that *splat cruft in the routes
    var loadUrl = Backbone.history.loadUrl;
    Backbone.history.loadUrl = function(url) {
        var stripped = url && url.replace(/\?.*$/, '');
        return loadUrl.call(this, stripped);
    };

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

        if (app.systemInfo.specify6_version !== app.systemInfo.database_version && !versionMismatchWarned) {
            $('<div title="Version Mismatch">' +
              '<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 50px 0;"></span>' +
              'The Specify version (' + app.systemInfo.specify6_version + ') ' +
              'does not match the database version (' + app.systemInfo.database_version + ').</p>' +
              '<p>Some features of Specify 7 may therefore fail to operate correctly.</p>' +
              '</div>').dialog({ modal: true });
            versionMismatchWarned = true;
        }
    }

    function handleError(jqxhr) {
        setCurrentView(new errorview.ErrorView({ request: jqxhr }));
        jqxhr.errorHandled = true;
    }

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

    var SpecifyRouter = Backbone.Router.extend({
        __name__: "SpecifyRouter",
        // maps the final portion of the URL to the appropriate backbone view
        routes: {
            ''           : 'welcome',
            'test_error/': 'testError', // cause a internal server error for testing
            '*whatever'  : 'notFound'   // match anything else.
        },

        // show a 'page not found' view for URLs we don't know how to handle
        notFound: function() {
            setCurrentView(new NotFoundView());
            app.setTitle('Page Not Found');
        },

        // this view shows the user the welcome screen
        welcome: function() {
            setCurrentView(new WelcomeView());
            app.setTitle('Welcome');
        },

        testError: function() {
            $.get('/api/test_error/');
        }
    });

    function appStart() {
        console.info('specify app starting');
        $(document).ajaxError(handleUnexpectedError);
        businessRules.enable(true);
        (new HeaderUI()).render();
        _.each(tasks, function(task) { task(app); });

        // start processing the urls to draw the corresponding views
        Backbone.history.start({pushState: true, root: '/specify/'});

        $('body').delegate('a.intercept-navigation', 'click', function(evt) {
            evt.preventDefault();
            var href = $(evt.currentTarget).prop('href');
            href && navigation.go(href);
        });
    }

    // build and display view for resource
    function showResource(resource, recordSet, pushUrl) {
        var viewMode = app.isReadOnly ? 'view' : 'edit';
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
        router: new SpecifyRouter(),
        handleError: handleError,
        setCurrentView: setCurrentView,
        showResource: showResource,
        setTitle: setTitle,
        getCurrentView: function() { return currentView; },  // a reference to the current view
        start: appStart,    // called by main.js to launch the webapp frontend
        // The following are set when the intial context is loaded.
        user: undefined,
        systemInfo: undefined,
        isReadOnly: undefined
    };

    initialContext
        .load('user.json', function(data) {
            app.user = data;
            app.isReadOnly = !_(['Manager', 'FullAccess']).contains(app.user.usertype);
        })
        .load('system_info.json', function(data) {
            app.systemInfo = data;
        });

    return app;
});
