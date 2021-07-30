'use strict';

import $ from 'jquery';
import _ from 'underscore';

import * as businessRules from './businessrules';
import { UnhandledErrorView } from './errorview';
import HeaderUI from './headerui';
import * as navigation from './navigation';
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
    $(`<div>
        ${commonText('sessionTimeOutDialogHeader')}
        ${commonText('sessionTimeOutDialogMessage')}
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
  new UnhandledErrorView({ jqxhr: jqxhr }).render();

  console.log(arguments);
}

export default function appStart() {
  console.info('specify app starting');
  // addBasicRoutes(router);
  $(document).ajaxError(handleUnexpectedError);
  businessRules.enable(true);
  new HeaderUI().render();
  _.each(tasks, function (task) {
    task();
  });

  // start processing the urls to draw the corresponding views
  navigation.start({ pushState: true, root: '/specify/' });

  $('body').delegate('a.intercept-navigation', 'click', function (evt) {
    evt.preventDefault();
    var href = $(evt.currentTarget).prop('href');
    href && navigation.go(href);
  });
};
