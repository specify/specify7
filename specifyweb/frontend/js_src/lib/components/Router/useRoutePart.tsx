import React from 'react';
import { UNSAFE_RouteContext as RouteContext } from 'react-router';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * For a URL like /specify/view/:tableName/:recordId,
 * Call this with name='tableName' and it will return the value of the tableName
 * as well as a callback to change it (changing it would clear :recordId)
 */
export function useRoutePart<T extends string = string>(
  name: string
): readonly [string | undefined, (value: T | undefined) => void] {
  const parameters = useParams();
  const { matches } = React.useContext(RouteContext);
  const navigate = useNavigate();

  function handleChange(value: string | undefined = ''): void {
    // Adding a parameter
    if (parameters[name] === undefined) {
      const path = matches.at(-1)!.pathname;
      const base = path.endsWith('/') ? path : `${path}/`;
      navigate(`${base}${value}`);
    }
    // Replacing a parameter
    else {
      const match =
        matches[
          matches.findIndex(({ route }) => route.path === `:${name}`) - 1
        ];
      if (match === undefined)
        throw new Error(`Unable to find the ${name} parameter in the URL`);
      const path = match.pathnameBase.endsWith('/')
        ? match.pathnameBase
        : `${match.pathnameBase}/`;
      navigate(`${path}${value}`);
    }
  }

  return [parameters[name], handleChange];
}
