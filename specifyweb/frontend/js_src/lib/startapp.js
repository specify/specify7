'use strict';

var $ = require('jquery');
var _ = require('underscore');

var businessRules = require('./businessrules.js');
var errorview = require('./errorview.js');
var navigation = require('./navigation.js');
const {MainView} = require("./components/main");
const commonText = require('./localization/common').default;

var tasks = [
  require('./welcometask.js'),
  require('./datatask.js'),
  require('./querytask.js'),
  require('./treetask.js'),
  require('./expresssearchtask.js'),
  require('./datamodeltask.js'),
  require('./attachmentstask.js').default,
  require('./wbtask.js'),
  require('./wbimporttask.js'),
  require('./wbplantask.js'),
  require('./appresourcetask.js'),
  require('./components/lifemapperwrapper').default,
];

function handleUnexpectedError(event, jqxhr, settings, exception) {
  if (jqxhr.errorHandled) return; // Not unexpected.
  if (jqxhr.status === 403) {
    $(`<div role="alert">
        ${commonText('sessionTimeOutDialogHeader')}
        <p>${commonText('sessionTimeOutDialogMessage')}</p>
    </div>`)
      .appendTo('body')
      .dialog({
        title: commonText('sessionTimeOutDialogTitle'),
        modal: true,
        dialogClass: 'ui-dialog-no-close',
        buttons: [
          {
            text: commonText('logIn'),
            click: function () {
              window.location = '/accounts/login/?next=' + window.location.href;
            },
          },
        ],
      });
    return;
  }
  new errorview.UnhandledErrorView({ jqxhr: jqxhr }).render();

  console.log(arguments);
}

module.exports = function appStart() {
  console.info('specify app starting');
  // addBasicRoutes(router);
  $(document).ajaxError(handleUnexpectedError);
  businessRules.enable(true);
  new MainView({el: document.getElementById('root-app-container') }).render();
  _.each(tasks, function (task) {
    task();
  });

  // start processing the urls to draw the corresponding views
  navigation.start({ pushState: true, root: '/specify/' });

  $('body').delegate('a', 'click', function (event) {
    if(
      event.currentTarget.classList.contains('intercept-navigation')
      || (
        event.altKey && event.currentTarget.target === '_blank'
      )
    ){
      event.preventDefault();
      const href = $(event.currentTarget).prop('href');
      href && navigation.go(href);
    }
  });
};
