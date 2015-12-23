"use strict";
require ('../css/main.css');

var initialContext = require('./initialcontext.js');
var startApp = require('./startapp.js');

    initialContext.lock().promise().done(startApp);

