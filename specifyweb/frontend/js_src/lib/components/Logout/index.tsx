import React from 'react';
import { ajax } from '../../utils/ajax';
import { LoadingScreen } from '../Molecules/Dialog';
import { formatUrl } from '../Router/queryString';
import { Http } from '../../utils/ajax/definitions';
import { softError } from '../Errors/assert';

export function Logout() : JSX.Element {
 ajax<any>('/accounts/logout/', {
   method: 'POST',
   headers: { },
  })
  .then(
    (response) => {
      if (response.status === Http.OK) {
	    globalThis.location.assign(formatUrl('/accounts/login/', {next: '/specify/'}))
      } else {
		  softError("POST to '/accounts/logout/' failed with code " + response.status + "\nBody:\n" + String(response.data))
	  }
  })
  .catch( (error) => softError(error) );

  return <LoadingScreen />
}
