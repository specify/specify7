import React from 'react';
import { ajax } from '../../utils/ajax';
import { LoadingScreen } from '../Molecules/Dialog';
import { formatUrl } from '../Router/queryString';
import { LoadingContext } from '../Core/Contexts';
import { softError } from '../Errors/assert';

export function Logout() : JSX.Element {
  const loading = React.useContext(LoadingContext);

  const next = globalThis.location.search;
  console.log(next)


  React.useEffect(
    () => {
      loading(
        ajax<string>('/accounts/logout/', { method: 'POST', headers: {  }, })
          .catch( (error) => softError(error) )
          .finally( () => globalThis.location.assign(formatUrl("/accounts/login/", {next: '/specify/'})) )
    )},
    []
  )

  return <LoadingScreen />
}
