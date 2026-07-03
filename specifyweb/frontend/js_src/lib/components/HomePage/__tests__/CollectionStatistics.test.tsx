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

    const dialog = await findByRole('dialog');
    await waitFor(() =>
      expect(dialog.querySelectorAll('tbody tr')).toHaveLength(4)
    );

    expect(dialog.textContent).toContain('Mammals');
    expect(dialog.textContent).toContain('Zoology');
    expect(dialog.textContent).toContain('Vascular Plants');
    expect(dialog.textContent).toContain('Botany');
    expect(dialog.textContent).toContain('Fossil Invertebrates');
    expect(dialog.textContent).toContain('Paleontology');
    expect(dialog.textContent).toContain('Birds');
  });
});

describe('empty state', () => {
  overrideAjax(statsUrl, []);

  test('shows the empty message and no table', async () => {
    const { getByRole, findByRole, user } = renderButton();

    await user.click(getByRole('button'));

    const dialog = await findByRole('dialog');
    await waitFor(() =>
      expect(dialog.textContent).toContain(collectionStatsText.noStatistics())
    );

    expect(dialog.querySelector('table')).toBeNull();
  });
});
