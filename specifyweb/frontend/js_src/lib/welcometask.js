'use strict';

var router = require('./router.js');

module.exports = function () {
  router.route('', 'welcome', function () {
    import('./welcomeview').then((WelcomeView) => WelcomeView());
  });
};
