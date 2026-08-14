import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { requireContext } from '../../../tests/helpers';
import { SchemaConfigRedirect } from '../Redirect';

requireContext();

describe('SchemaConfigRedirect', () => {
  test('redirects to the first accessible table', () => {
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
            element={<div>table page</div>}
            path="/specify/schema-config/:language/:tableName"
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('table page')).toBeInTheDocument();
  });
});
