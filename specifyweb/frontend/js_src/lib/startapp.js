'use strict';

import $ from 'jquery';
import React from 'react';
import Modal from 'react-modal';

import * as businessRules from './businessrules';
import commonText from './localization/common';
import {csrfToken} from './csrftoken';
import {csrfSafeMethod, ping} from './ajax';
import * as navigation from './navigation';
import {router} from './router';
import {NotFoundView} from './notfoundview';
import {setCurrentView} from './specifyapp';
import {crash, UnhandledErrorView} from './components/errorboundary';
import {showDialog} from './components/modaldialog';

$.ajaxSetup({
  beforeSend: function (xhr, settings) {
    if (!csrfSafeMethod.has(settings.type.toUpperCase()) && !this.crossDomain) {
      xhr.setRequestHeader('X-CSRFToken', csrfToken);
    }
  },
});
$(document).ajaxError(handleUnexpectedError);

function handleUnexpectedError(event, jqxhr, settings, exception) {
  if (jqxhr.errorHandled) return; // Not unexpected.

  if (jqxhr.status === 403)
    showDialog({
      title: commonText('sessionTimeOutDialogTitle'),
      header: commonText('sessionTimeOutDialogHeader'),
      content: commonText('sessionTimeOutDialogMessage'),
      forceToTop: true,
      onClose: ()=>window.location.assign(`/accounts/login/?next=${window.location.href}`),
      buttons: commonText('logIn')
    });
  else {
    const view = new UnhandledErrorView({
      title: commonText('backEndErrorDialogTitle'),
      header: commonText('backEndErrorDialogHeader'),
      children: jqxhr.responseText,
      onClose: () => view.remove(),
    }).render();
    console.log({ event, jqxhr, settings, exception });
  }
}

const tasksPromise = Promise.all([
  import('./welcometask'),
  import('./datatask'),
  import('./components/querytask'),
  import('./treetask'),
  import('./components/expresssearchtask'),
  import('./components/toolbar/schema'),
  import('./components/attachmentstask'),
  import('./wbtask'),
  import('./wbimporttask'),
  import('./wbplantask'),
  import('./appresourcetask'),
  import('./components/toolbar/security'),
]).then((tasks) => () => tasks.forEach(({ default: task }) => task()));

router
  .route('*whatever', 'notFound', function () {
    setCurrentView(new NotFoundView());
  })
  .route('test_error/', 'testError', function () {
    void ping('/api/test_error/');
  });

export default function appStart() {
  console.info('specify app starting');
  businessRules.enable(true);
  tasksPromise
    .then((execute) => execute())
    .then(() => navigation.start())
    .catch(crash);

  Modal.setAppElement('#root');
}
