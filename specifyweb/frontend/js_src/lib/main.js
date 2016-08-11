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


initialContext.lock().promise().done(startApp);

