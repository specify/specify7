import { waitFor } from '@testing-library/react';
import React from 'react';

import { collectionStatsText } from '../../../localization/collectionStats';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { CollectionStatisticsButton } from '../CollectionStatistics';

requireContext();

const statsUrl = '/context/collection_stats.json';

function renderButton() {
  return mount(
    <UnloadProtectsContext.Provider value={[]}>
      <CollectionStatisticsButton />
    </UnloadProtectsContext.Provider>
  );
}

describe('with data', () => {
  overrideAjax(statsUrl, [
    { name: 'Mammals', specimenCount: 1111, collectionType: 'Zoology' },
    { name: 'Vascular Plants', specimenCount: 22222, collectionType: 'Botany' },
    { name: 'Fossil Invertebrates', specimenCount: 3333, collectionType: 'Paleontology' },
    { name: 'Birds', specimenCount: 44444, collectionType: 'Zoology' },
  ]);

  test('renders a row for each collection', async () => {
    const { getByRole, findByRole, user } = renderButton();

    await user.click(getByRole('button'));

    const table = await findByRole('table');
    expect(table.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(table.textContent).toContain('Mammals');
    expect(table.textContent).toContain('Birds');
  });

  test('sorts by a column when its header is clicked', async () => {
    const { getByRole, findByRole, user } = renderButton();

    await user.click(getByRole('button'));
    const table = await findByRole('table');

    await user.click(
      getByRole('button', { name: collectionStatsText.numberOfSpecimens() })
    );

    await waitFor(() =>
      expect(table.querySelectorAll('tbody tr')[0].textContent).toContain(
        'Mammals'
      )
    );
  });
});

describe('empty state', () => {
  overrideAjax(statsUrl, []);

  test('shows the empty message and no table', async () => {
    const { getByRole, findByText, queryByRole, user } = renderButton();

    await user.click(getByRole('button'));

    await findByText(collectionStatsText.noStatistics());
    expect(queryByRole('table')).toBeNull();
  });
});
