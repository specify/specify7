import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { sortFunction } from '../../utils/utils';
import { genericTables } from '../DataModel/tables';
import { tablesFilter } from './Tables';

export function SchemaConfigRedirect(): JSX.Element | null {
  const { language = '' } = useParams();
  const firstTable = React.useMemo(
    () =>
      Object.values(genericTables)
        .filter((table) => tablesFilter(false, false, true, table))
        .sort(sortFunction(({ name }) => name))[0],
    []
  );

  return firstTable === undefined ? null : (
    <Navigate
      replace
      to={`/specify/schema-config/${language}/${firstTable.name}/`}
    />
  );
}
