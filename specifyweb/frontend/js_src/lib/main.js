"use strict";
require('babel-polyfill');
require('../css/main.css');

const $ = require('jquery');

var initialContext = require('./initialcontext.js');
var startApp = require('./startapp.js');

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


// From https://docs.djangoproject.com/en/1.10/ref/csrf/

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = $.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

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

