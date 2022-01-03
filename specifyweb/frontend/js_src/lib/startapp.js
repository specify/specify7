'use strict';

import $ from 'jquery';
import React from "react";

import * as businessRules from './businessrules';
import {UnhandledErrorView} from './errorview';
import commonText from './localization/common';
import csrftoken from "./csrftoken";
import ajax, {csrfSafeMethod} from "./ajax";
import * as navigation from './navigation';
import router from "./router";
import NotFoundView from "./notfoundview";
import {setCurrentView} from "./specifyapp";
import {crash} from "./components/errorboundary";

$.ajaxSetup({
  beforeSend: function (xhr, settings) {
    if (!csrfSafeMethod.has(settings.type.toUpperCase()) && !this.crossDomain) {
      xhr.setRequestHeader("X-CSRFToken", csrftoken);
    }
  }
});
$(document).ajaxError(handleUnexpectedError);

function handleUnexpectedError(event, jqxhr, settings, exception) {
  if (jqxhr.errorHandled)
    return; // Not unexpected.

  if (jqxhr.status === 403)
    $(`<div role="alert">
        ${commonText('sessionTimeOutDialogHeader')}
        <p>${commonText('sessionTimeOutDialogMessage')}</p>
    </div>`)
      .appendTo('body')
      .dialog({
        title: commonText('sessionTimeOutDialogTitle'),
        modal: true,
        dialogClass: 'ui-dialog-no-close',
        buttons: [{
          text: commonText('logIn'), click: function () {
            window.location = '/accounts/login/?next=' + window.location.href;
          },
        },],
      });
  else {
    new UnhandledErrorView({response: jqxhr.responseText}).render();
    console.log({event, jqxhr, settings, exception});
  }
}


const tasksPromise = Promise.all([import('./welcometask'), import('./datatask'), import('./querytask'), import('./treetask'), import('./expresssearchtask'), import('./datamodeltask'), import('./attachmentstask'), import('./wbtask'), import('./wbimporttask'), import('./wbplantask'), import('./appresourcetask'), import('./components/lifemapperwrapper'),]).then((tasks) => () => tasks.forEach(({default: task}) => task()));

router
  .route('*whatever', 'notFound', function () {
    setCurrentView(new NotFoundView());
  })
  .route('test_error/', 'testError', function () {
    void ajax('/api/test_error/');
  })

export default function appStart() {
  console.info('specify app starting');
  businessRules.enable(true);
  tasksPromise.then(execute => execute())
    .then(() => navigation.start())
    .catch(crash);

  // setup basic routes.
};
