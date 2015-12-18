"use strict";

var initialContext = require('./initialcontext.js');
var startApp = require('./startapp.js');

    initialContext.lock().promise().done(startApp);

