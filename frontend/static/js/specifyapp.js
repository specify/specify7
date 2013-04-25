define([
    'jquery', 'underscore', 'backbone', 'schema', 'cs!businessrules',
    'errorview', 'welcomeview', 'headerui', 'notfoundview',
    'text!context/user.json!noinline',
// Tasks
    'datatask',
    'querytask',
    'expresssearchtask',
    'datamodeltask'
], function module(
    $, _, Backbone, schema, businessRules, ErrorView,
    WelcomeView, HeaderUI, NotFoundView, userJSON) {
    "use strict";
    var tasks = _(arguments).tail(module.length);

    var currentView;

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
    }

    function handleError(jqxhr) {
        setCurrentView(new ErrorView({ request: jqxhr }));
        jqxhr.errorHandled = true;
    }

    function handleUnexpectedError(event, jqxhr, settings, exception) {
        if (jqxhr.errorHandled) return;
        if (jqxhr.status === 403) {
            showErrorDialog($('<div title="Session Logged Out">'
                              + 'Your current session has been logged out.'
                              + '</div>'),
                            { buttons: [{
                                text: 'Login',
                                click: function() {
                                    window.location = "/accounts/login/?next=" +
                                        window.location.href;
                                }
                            }]});
            return;
        }
        showErrorDialog($('<div title="Unexpected Error">'
                          + 'An unexpected error has occured during communication with the server.'
                          + '</div>'));

        console.log(arguments);
    }

    function showErrorDialog(el, options) {
            el.appendTo('body').dialog(_.extend({
            modal: true,
            open: function(evt, ui) { $('.ui-dialog-titlebar-close', ui.dialog).hide(); }
        }, options));
    }

    var SpecifyRouter = Backbone.Router.extend({
        // maps the final portion of the URL to the appropriate backbone view
        routes: {
            ''                      : 'welcome',
            '*whatever'             : 'notFound'   // match anything else.
        },

        // show a 'page not found' view for URLs we don't know how to handle
        notFound: function() {
            setCurrentView(new NotFoundView());
            window.document.title = 'Page Not Found | Specify WebApp';
        },

        // this view shows the user the welcome screen
        welcome: function() {
            setCurrentView(new WelcomeView());
            window.document.title = 'Welcome | Specify WebApp';
        }
    });

    function appStart() {
        $(document).ajaxError(handleUnexpectedError);
        businessRules.enable(true);
        (new HeaderUI()).render();
        _.each(tasks, function(task) { task(app); });

        // start processing the urls to draw the corresponding views
        Backbone.history.start({pushState: true, root: '/specify/'});
    }


    // the exported interface
    var app = {
        router: new SpecifyRouter(),
        handleError: handleError,
        setCurrentView: setCurrentView,
        getCurrentView: function() { return currentView; },  // a reference to the current view
        start: appStart,    // called by main.js to launch the webapp frontend
        user: $.parseJSON(userJSON)  // the currently logged in SpecifyUser
    };


    return app;
});
