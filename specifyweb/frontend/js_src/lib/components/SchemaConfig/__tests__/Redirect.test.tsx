import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';

import { requireContext } from '../../../tests/helpers';
import { defined } from '../../../utils/types';
import { sortFunction } from '../../../utils/utils';
import { genericTables } from '../../DataModel/tables';
import { SchemaConfigRedirect } from '../Redirect';
import { tablesFilter } from '../Tables';

requireContext();

function TableName(): JSX.Element {
  const { tableName = '' } = useParams();
  return <div>{tableName}</div>;
}

describe('SchemaConfigRedirect', () => {
  test('redirects to the first accessible table', () => {
    const firstTable = defined(
      Object.values(genericTables)
        .filter((table) => tablesFilter(false, false, true, table))
        .sort(sortFunction(({ name }) => name))[0]
    );

    render(
      <MemoryRouter
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
        initialEntries={['/specify/schema-config/en-us/']}
      >
        <Routes>
          <Route
            element={<SchemaConfigRedirect />}
            path="/specify/schema-config/:language"
          />
          <Route
            element={<TableName />}
            path="/specify/schema-config/:language/:tableName"
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(firstTable.name)).toBeInTheDocument();
  });
});
