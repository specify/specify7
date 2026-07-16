import React from 'react';
import { ajax } from '../../utils/ajax';
import { LoadingScreen } from '../Molecules/Dialog';
import { formatUrl } from '../Router/queryString';
import { Http } from '../../utils/ajax/definitions';

export function Logout() : JSX.Element {
 ajax<any>('/accounts/logout/', {
   method: 'POST',
   headers: { },
  })
  .then(
    (response) => {
      if (response.status == Http.OK) {
	    globalThis.location.assign(formatUrl('/accounts/login/', {next: '/specify/'}))
      }
  });
  // may need to do error handling here

  return <LoadingScreen />
}
