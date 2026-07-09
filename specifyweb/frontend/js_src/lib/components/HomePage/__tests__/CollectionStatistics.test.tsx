import { screen, within } from '@testing-library/react';
import React from 'react';

import { clearIdStore } from '../../../hooks/useId';
import { collectionStatisticsText } from '../../../localization/collectionStatistics';
import { overrideAjax } from '../../../tests/ajax';
import { mount } from '../../../tests/reactUtils';
import { f } from '../../../utils/functools';
import type { RA } from '../../../utils/types';
import { LoadingContext } from '../../Core/Contexts';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import type { CollectionStat } from '../CollectionStatistics';
import { CollectionStatistics } from '../CollectionStatistics';

beforeEach(() => clearIdStore());

const sampleStats: RA<CollectionStat> = [
  { name: 'Mammals', specimenCount: 12_543, collectionType: 'Zoology' },
  { name: 'Birds', specimenCount: 8391, collectionType: 'Zoology' },
];

/** Render the widget and click the button to open the statistics dialog. */
async function openDialog(): Promise<void> {
  const { user } = mount(
    <UnloadProtectsContext.Provider value={[]}>
      <LoadingContext.Provider value={f.void}>
        <CollectionStatistics />
      </LoadingContext.Provider>
    </UnloadProtectsContext.Provider>
  );
  await user.click(
    screen.getByRole('button', {
      name: collectionStatisticsText.collectionStatistics(),
    })
  );
  await screen.findByRole('dialog');
}

describe('CollectionStatistics with data', () => {
  overrideAjax('/context/collection_stats.json', sampleStats);

  test('renders a table with a row and columns per collection', async () => {
    await openDialog();

    const table = await screen.findByRole('table');

    // The three specified columns show up as headers.
    screen.getByRole('columnheader', {
      name: new RegExp(collectionStatisticsText.collectionName(), 'u'),
    });
    screen.getByRole('columnheader', {
      name: new RegExp(collectionStatisticsText.numberOfSpecimens(), 'u'),
    });
    screen.getByRole('columnheader', {
      name: new RegExp(collectionStatisticsText.collectionType(), 'u'),
    });

    // One header row + one row per collection.
    expect(within(table).getAllByRole('row')).toHaveLength(
      sampleStats.length + 1
    );

    // Each collection's data shows up.
    screen.getByRole('cell', { name: 'Mammals' });
    screen.getByRole('cell', { name: 'Birds' });
    screen.getByRole('cell', { name: /12.?543/u });
    expect(screen.getAllByRole('cell', { name: 'Zoology' })).toHaveLength(2);
  });
});

describe('CollectionStatistics empty state', () => {
  overrideAjax('/context/collection_stats.json', []);

  test('shows the empty message and no table', async () => {
    await openDialog();

    await screen.findByText(collectionStatisticsText.noStatistics());
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
