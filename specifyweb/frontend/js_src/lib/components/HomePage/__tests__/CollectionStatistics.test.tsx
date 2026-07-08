import { render, screen } from '@testing-library/react';
import React from 'react';

import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { CollectionStatistics } from '../CollectionStatistics';

requireContext();

describe('populated', () => {
  overrideAjax('/stats/collection/statistics/', [
    { name: 'Mammals', specimenCount: 8214, collectionType: 'Zoology' },
    { name: 'Fish', specimenCount: 15872, collectionType: 'Ichthyology' },
  ]);

  test('renders the table with fetched rows', async () => {
    render(
      <UnloadProtectsContext.Provider value={[]}>
        <CollectionStatistics onClose={jest.fn()} />
      </UnloadProtectsContext.Provider>
    );

     expect(await screen.findByRole('cell', { name: 'Mammals' })).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: 'Fish' })).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: '8214' })).toBeInTheDocument();
  });
});

describe('empty', () => {
  overrideAjax('/stats/collection/statistics/', []);

  test('shows the empty-state message', async () => {
    render(
      <UnloadProtectsContext.Provider value={[]}>
        <CollectionStatistics onClose={jest.fn()} />
      </UnloadProtectsContext.Provider>
    );

    expect(
      await screen.findByText('No collection statistics are available.')
    ).toBeInTheDocument();
  });
});

describe('error', () => {
  overrideAjax('/stats/collection/statistics/', {}, { responseCode: 500 });

  test('shows the error-state message', async () => {
  jest.spyOn(console, 'error').mockImplementation();
    render(
      <UnloadProtectsContext.Provider value={[]}>
        <CollectionStatistics onClose={jest.fn()} />
      </UnloadProtectsContext.Provider>
    );

    expect(
      await screen.findByText(
        'Unable to load collection statistics. Please try again.'
      )
    ).toBeInTheDocument();
  });
});
