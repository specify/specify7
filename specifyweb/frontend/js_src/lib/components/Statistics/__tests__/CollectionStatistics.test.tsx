import React from 'react';

import { statsText } from '../../../localization/stats';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { Http } from '../../../utils/ajax/definitions';
import { OverlayContext } from '../../Router/Router';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { CollectionStatisticsOverlay } from '../CollectionStatistics';

requireContext();

const endpoint = '/stats/collection/summary/';

const renderOverlay = () =>
  mount(
    <UnloadProtectsContext.Provider value={[]}>
      <OverlayContext.Provider value={jest.fn()}>
        <CollectionStatisticsOverlay />
      </OverlayContext.Provider>
    </UnloadProtectsContext.Provider>
  );

describe('CollectionStatisticsOverlay with data', () => {
  const statistics = [
    { name: 'Mammals', specimenCount: 12543, collectionType: 'Zoology' },
    { name: 'Herbarium', specimenCount: 8210, collectionType: 'Botany' },
  ];
  overrideAjax(endpoint, statistics);

  test('renders a table row for each collection', async () => {
    const { findByRole, getByRole } = renderOverlay();

    // Wait for the fetch to resolve and the table to render.
    await findByRole('cell', { name: 'Mammals' });

    getByRole('table');
    getByRole('cell', { name: 'Herbarium' });
    getByRole('cell', { name: '12543' });
    getByRole('cell', { name: 'Zoology' });
  });
});

describe('CollectionStatisticsOverlay with no data', () => {
  overrideAjax(endpoint, []);

  test('shows the empty message and no table', async () => {
    const { findByText, queryByRole } = renderOverlay();

    await findByText(statsText.noCollectionStatistics());
    expect(queryByRole('table')).toBeNull();
  });
});

describe('CollectionStatisticsOverlay when the request fails', () => {
  overrideAjax(endpoint, '', { responseCode: Http.SERVER_ERROR });

  test('shows an error message and no table', async () => {
    // ajax logs the failed request via console.error even in silent mode;
    // mock it so this expected error does not fail the test.
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const { findByRole, queryByRole } = renderOverlay();

    const alert = await findByRole('alert');
    expect(alert).toHaveTextContent(statsText.unableToLoadStatistics());
    expect(queryByRole('table')).toBeNull();

    consoleError.mockRestore();
  });
});
