import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { overrideAjax } from '../../../tests/ajax';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { CollectionStats } from '../CollectionStats';

const renderCollectionStats = (): void => {
  render(
    <UnloadProtectsContext.Provider value={[]}>
      <CollectionStats />
    </UnloadProtectsContext.Provider>
  );
};

describe('CollectionStats', () => {
  describe('when endpoint returns rows', () => {
    const rows = [
      {
        name: 'Mammals',
        specimenCount: 12543,
        collectionType: 'Zoology',
      },
      {
        name: 'Bugs',
        specimenCount: 1254300,
        collectionType: 'Entomology',
      },
    ];

    overrideAjax('/stats/collection/statistics/', rows, {}, true);

    test('renders the table with sample data', async () => {
      renderCollectionStats();

      fireEvent.click(screen.getByRole('button', { name: commonText.collStats() }));

      await waitFor(() =>
        expect(
          screen.getByRole('columnheader', { name: commonText.collName() })
        ).toBeInTheDocument()
      );

      expect(screen.getByRole('cell', { name: 'Mammals' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '12,543' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Zoology' })).toBeInTheDocument();

      expect(screen.getByRole('cell', { name: 'Bugs' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '1,254,300' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Entomology' })).toBeInTheDocument();
    });
  });

  describe('when endpoint returns no rows', () => {
    overrideAjax('/stats/collection/statistics/', [], {}, true);

    test('renders empty state', async () => {
      renderCollectionStats();

      fireEvent.click(screen.getByRole('button', { name: commonText.collStats() }));

      await waitFor(() =>
        expect(
          screen.getByText(commonText.noCollectionStats())
        ).toBeInTheDocument()
      );
    });
  });


  describe('when endpoint returns no non-tabular/erroneous data', () => {
    overrideAjax('/stats/collection/statistics/', 'boop', {}, true);

    test('renders empty state', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      renderCollectionStats();

      fireEvent.click(screen.getByRole('button', { name: commonText.collStats() }));

      await waitFor(() =>
        expect(
          screen.getByText(commonText.failedCollectionStats())
        ).toBeInTheDocument()
      );

      expect(errorSpy).toHaveBeenCalledWith({
        type: 'jsonParseFailure',
        statusText: 'Failed parsing JSON response:',
        responseText: 'boop',
      });

      errorSpy.mockRestore();
    });
  });
});
