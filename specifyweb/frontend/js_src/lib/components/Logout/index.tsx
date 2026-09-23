import React from 'react';
import { useSearchParameter } from '../../hooks/navigation';
import { ajax } from '../../utils/ajax';
import { LoadingScreen } from '../Molecules/Dialog';
import { formatUrl } from '../Router/queryString';
import { LoadingContext } from '../Core/Contexts';
import { softError } from '../Errors/assert';

export function Logout(): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const [nextUrl = '/specify/'] = useSearchParameter('nextUrl');

  console.log('next => ' + nextUrl);

  React.useEffect(() => {
    loading(
      ajax<string>('/accounts/logout/', { method: 'POST', headers: {} })
        .catch((error) => softError(error))
        .finally(() =>
          globalThis.location.assign(
            formatUrl('/accounts/login/', { next: nextUrl })
          )
        )
    );
  }, [loading]);

  return <LoadingScreen />;
}
