import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { requireContext } from '../../../tests/helpers';
import { TableDataView } from '..';

requireContext();

jest.mock('../queries', () => ({
  ...jest.requireActual('../queries'),
  useDataViewQueries: () => [{ version: 1, queries: {} }, jest.fn()],
}));
jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasPermission: () => true,
}));
jest.mock('../../Permissions/PermissionDenied', () => ({
  ProtectedTable: ({ children }: { readonly children: React.ReactNode }) =>
    children,
}));
jest.mock('../../QueryBuilder/ResultsWrapper', () => {
  const actualReact = jest.requireActual<typeof React>('react');
  const { RecordMergingContext } = jest.requireActual('../../Core/Contexts');
  return {
    ...jest.requireActual('../../QueryBuilder/ResultsWrapper'),
    QueryResultsWrapper: () => (
      <div>
        {actualReact.useContext(RecordMergingContext)
          ? 'Merging enabled'
          : 'Merging disabled'}
      </div>
    ),
  };
});

test('disables merging throughout Data Views', () => {
  render(
    <MemoryRouter initialEntries={['/specify/dataviews/agent/']}>
      <Routes>
        <Route
          path="/specify/dataviews/:tableName/"
          element={<TableDataView />}
        />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByText('Merging disabled')).toBeInTheDocument();
});
