"use strict";
require('babel-polyfill');
require('../css/main.css');

const $ = require('jquery');

const initialContext = require('./initialcontext.js');
const startApp = require('./startapp.js');
const csrftoken = require('./csrftoken.js');

// Stop bckspc from navigating back.
// Based on:
// http://stackoverflow.com/questions/1495219/how-can-i-prevent-the-backspace-key-from-navigating-back

$(document).unbind('keydown').bind('keydown', (event) => {
    if (event.keyCode !== 8) return;

    const el = event.srcElement || event.target;
    const tagName = el.tagName.toLowerCase();
    const type = el.type && el.type.toLowerCase();

    let prevent = true;

    if ((tagName === 'input' &&
         (type === 'text' ||
          type === 'password' ||
          type === 'file' ||
          type === 'search' ||
          type === 'email' ||
          type === 'number' ||
          type === 'date')
        ) || tagName === 'textarea') {

        prevent = el.readOnly || el.disabled;
    }

    prevent && event.preventDefault();
});


function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

initialContext.lock().promise().done(startApp);

