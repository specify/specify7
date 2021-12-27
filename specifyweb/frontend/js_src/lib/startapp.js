'use strict';

import $ from 'jquery';
import _ from 'underscore';

import * as businessRules from './businessrules';
import { UnhandledErrorView } from './errorview';
import * as navigation from './navigation';
import {MainView} from "./components/main";
import commonText from './localization/common';

var tasks = [
  require('./welcometask').default,
  require('./datatask').default,
  require('./querytask').default,
  require('./treetask').default,
  require('./expresssearchtask').default,
  require('./datamodeltask').default,
  require('./attachmentstask').default,
  require('./wbtask').default,
  require('./wbimporttask').default,
  require('./wbplantask').default,
  require('./appresourcetask').default,
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
  new UnhandledErrorView({response: jqxhr.responseText}).render();

  console.log(arguments);
}

export default function appStart() {
  console.info('specify app starting');
  // addBasicRoutes(router);
  $(document).ajaxError(handleUnexpectedError);
  businessRules.enable(true);
  new MainView({
    el: document.getElementById('root-app-container'),
    onReady() {
      document.getElementById('loading')?.remove();
      document.getElementById('root-app-container').style.display = '';

      // Start processing the urls to draw the corresponding views
      navigation.start();
    }
  }).render();

  _.each(tasks, function (task) {
    task();
  });

  $('body').delegate('a', 'click', function (event) {
    if (
      event.currentTarget.classList.contains('intercept-navigation')
      || (
        event.altKey && event.currentTarget.target === '_blank'
      )
    ) {
      event.preventDefault();
      const href = $(event.currentTarget).prop('href');
      href && navigation.go(href);
    }
  });
};
