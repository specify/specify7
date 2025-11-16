import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { ThresholdRank } from '../Renderers';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import * as treeRanks from '../../InitialContext/treeRanks';
import { preferencesText } from '../../../localization/preferences';
import type { PreferenceItem } from '../types';

overrideAjax('/context/schema_localization.json', {});
requireContext();

const mockedGetTreeDefinitions = jest.spyOn(
  treeRanks,
  'getTreeDefinitions'
);

describe('ThresholdRank', () => {
  beforeEach(() => {
    mockedGetTreeDefinitions.mockReset();
  });

  test('only renders ranks from the active tree definition', async () => {
    mockedGetTreeDefinitions.mockReturnValue([
      {
        definition: { id: 1 } as any,
        ranks: [
          { rankId: 50, name: 'Active Rank B' },
          { rankId: 10, name: 'Active Rank A' },
        ] as any,
      },
      {
        definition: { id: 2 } as any,
        ranks: [{ rankId: 5, name: 'Inactive Rank' }] as any,
      },
    ]);

    const definition: PreferenceItem<number> = {
      title: preferencesText.rankThreshold(),
      requiresReload: false,
      visible: true,
      defaultValue: 0,
      values: [],
    };
    render(
      <ThresholdRank
        category="tree"
        definition={definition}
        item="rankThreshold"
        subcategory="geography"
        onChange={jest.fn()}
        tableName="Geography"
        value={50}
      />
    );

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3));

    const labels = screen.getAllByRole('option').map((option) => option.textContent);
    expect(labels).toEqual(['None', 'Active Rank A', 'Active Rank B']);
    expect(screen.queryByText('Inactive Rank')).not.toBeInTheDocument();
  });
});
