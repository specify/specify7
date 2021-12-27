"use strict";
import '../css/main.css';

import $ from 'jquery';

import * as initialContext from './initialcontext';
import startApp from './startapp';
import csrftoken from './csrftoken';

// Stop bckspc from navigating back.
// Based on:
// https://stackoverflow.com/questions/1495219/how-can-i-prevent-the-backspace-key-from-navigating-back

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

// These HTTP methods do not require CSRF protection
const csrfSafeMethod = new Set(['GET','HEAD','OPTIONS','TRACE']);

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod.has(settings.type.toUpperCase()) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

initialContext.lock();
initialContext.promise().done(startApp);

