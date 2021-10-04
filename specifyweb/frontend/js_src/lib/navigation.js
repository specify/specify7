"use strict";

const $        = require('jquery');
const _        = require('underscore');
const Backbone = require('./backbone.js');
const commonText = require('./localization/common').default;

// We introduce a sequence variable that is incremented and passed in
// the state argument of each history.pushState invocation. When a
// popstate event occurs, we can use the relative sequence values to
// 'undo' the popstate in the case that the user elects not to leave
// the current context.


function sequenceFromState(state) {
    return state == null ? 0
        : state.sequence == null ? 0
        : state.sequence;
}

// If the page is reloaded, the sequence needs to be set from the
// stored state.
let sequence = sequenceFromState(window.history.state);

let unloadBlockers = [];
let onBeforeUnloadHandler = undefined;

function addUnloadProtect(
  key,
  message,
  confirmNavigationHandler=defaultConfirmNavigationHandler
) {
    unloadBlockers = [...unloadBlockers, [key, message, confirmNavigationHandler]];
    changeOnBeforeUnloadHandler(()=>message);
}

function changeOnBeforeUnloadHandler(handler){
    if(typeof onBeforeUnloadHandler === 'function')
        window.removeEventListener('onbeforeunload',onBeforeUnloadHandler);
    onBeforeUnloadHandler = handler;
    if(typeof handler === 'function')
        window.addEventListener('onbeforeunload',onBeforeUnloadHandler);
}

function removeUnloadProtect(remKey) {
    unloadBlockers = unloadBlockers.filter(([key]) => key !== remKey);
    changeOnBeforeUnloadHandler( unloadBlockers.length === 0 ? undefined :
        () => {
            const [key, message] = unloadBlockers[unloadBlockers.length - 1];
            return message;
        }
    );
}

function clearUnloadProtect() {
    unloadBlockers = [];
    changeOnBeforeUnloadHandler(undefined);
}

// We are going to extend the window.history object to automatically
// increment and store the sequence value on all pushState invocations.
Backbone.history.history = Object.create(window.history);

Backbone.history.history.sequence = function() {
    return sequenceFromState(window.history.state);
};

Backbone.history.history.pushState = function(state, title, url) {
    sequence++;
    state.sequence = sequence;
    return window.history.pushState(state, title, url);
};

Backbone.history.history.replaceState = function(state, title, url) {
    state.sequence = sequence;
    return window.history.replaceState(state, title, url);
};

// Make the Backbone routing mechanisms ignore queryparams in urls
// this gets rid of all that *splat cruft in the routes.
const loadUrl = Backbone.history.loadUrl;
Backbone.history.loadUrl = function(url) {
    const stripped = url && url.replace(/\?.*$/, '');
    return loadUrl.call(this, stripped);
};

// The Backbone history system binds checkUrl to the popstate
// event. We replace it with a version that checks if unloadProtect is
// set and optionally backs out the popstate in that case.
const checkUrl = Backbone.history.checkUrl;
Backbone.history.checkUrl = function(e) {
    const poppedSequence = sequenceFromState(e.originalEvent.state);
    // If a popstate is canceled, we use window.history.go to return
    // to previous point in the history, which results another
    // popstate event where the sequence is the current sequence.
    if (poppedSequence === sequence) return;

    // Handle the noop situation where the new URL is unchanged.
    const current = Backbone.history.getFragment();
    if (current === Backbone.history.fragment) return;

    // This continuation "proceeds" to the popped history by updating
    // the current sequence and then invoking the default Backbone
    // popstate handler.
    const proceed = () => {
        sequence = poppedSequence;
        checkUrl(e);
    };

    // This continuation "cancels" the popstate event by returning to
    // the point in history from whence it came. This will result in
    // another popstate event with the current sequence, which is
    // ignored above.
    const cancel = () => window.history.go(sequence - poppedSequence);

    unloadBlockers.length > 0 ? confirmNavigation(proceed, cancel) : proceed();
};

// Open a dialog allowing the user to proceed with the navigation, or
// remain on the same page. The proceed or cancel continuation will be
// invoked accordingly. The unloadProtect variable will be cleared if
// proceeding.
function defaultConfirmNavigationHandler(proceed, cancel){
    const [key, message] = unloadBlockers[unloadBlockers.length - 1];

    $(`<aside>
        ${commonText('leavePageDialogHeader')}
        <p>${message}</p>
    </aside>`).dialog({
        title: commonText('leavePageDialogTitle'),
        modal: true,
        close() {
            $(this).remove();
        },
        buttons: {
            [commonText('cancel')]() {
                $(this).dialog('close');
                cancel();
            },
            [commonText('leave')]() {
                $(this).dialog('close');
                proceed();
            },
        }
    });
}

function confirmNavigation(proceed, cancel){
    const [key, message, confirmNavigationHandler] = unloadBlockers[unloadBlockers.length - 1];
    confirmNavigationHandler(proceed, cancel);
}

function navigate(url, options) {
    const cont = () => {
        clearUnloadProtect();

        var origin = window.location.origin || (
            window.location.protocol + '//' + window.location.host);

        url = url.replace(RegExp('^' + origin), '');
        Backbone.history.navigate(url.replace(/^\/specify/, ''), options);
    };

    unloadBlockers.length > 0 ? confirmNavigation(cont, () => {}) : cont();
}

module.exports = {
    start: function() {
        Backbone.history.start({pushState: true, root: '/specify/'});
    },
    navigate: navigate,
    addUnloadProtect: addUnloadProtect,
    removeUnloadProtect: removeUnloadProtect,
    clearUnloadProtect: clearUnloadProtect,
    go: function(url) {
        navigate(url, true);
    },
    push: function(url) {
        navigate(url, {trigger: false, replace: true});
    },
    switchCollection: function(collection, nextUrl) {
        $.ajax({
            url: '/context/collection/',
            type: 'POST',
            data: _.isNumber(collection) ? collection : collection.id,
            processData: false
        }).done(function() {
            if (nextUrl) {
                window.location = nextUrl;
            } else {
                window.location.reload();
            }
        });
    }
};
