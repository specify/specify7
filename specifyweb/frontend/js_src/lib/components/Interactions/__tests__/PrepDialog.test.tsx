import React from 'react';
import { within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { interactionsText } from '../../../localization/interactions';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { LoadingContext } from '../../Core/Contexts';
import { tables } from '../../DataModel/tables';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import type { PreparationData } from '../helpers';
import { PrepDialog } from '../PrepDialog';

jest.mock('../../Formatters/fieldFormat', () => ({
  syncFieldFormat: (_field: unknown, value: string) => value,
}));

jest.mock('../../Molecules/FormattedResource', () => ({
  FormattedResource: () => null,
}));

requireContext();

const preparation = (
  preparationId: number,
  available: number
): PreparationData => ({
  catalogNumber: `${preparationId}`,
  collectionObjectId: preparationId,
  taxon: 'Test taxon',
  taxonId: preparationId,
  preparationId,
  prepType: 'Fluid',
  countAmount: available + 3,
  loaned: 0,
  gifted: 0,
  exchanged: 0,
  available,
});

const noop = (): void => undefined;

test('Select All and Deselect All update every preparation', async () => {
  const { getAllByRole, getByRole, user } = mount(
    <MemoryRouter>
      <UnloadProtectsContext.Provider value={[]}>
        <LoadingContext.Provider value={noop}>
          <PrepDialog
            onClose={noop}
            preparations={[
              preparation(1, 3),
              preparation(2, 5),
              preparation(3, 0),
            ]}
            table={tables.Loan}
          />
        </LoadingContext.Provider>
      </UnloadProtectsContext.Provider>
    </MemoryRouter>
  );

  const values = (): readonly string[] =>
    getAllByRole('row')
      .filter((row) => within(row).queryByRole('checkbox') !== null)
      .map(
        (row) => (within(row).getByRole('spinbutton') as HTMLInputElement).value
      );

  await user.click(getByRole('button', { name: interactionsText.selectAll() }));
  expect(values()).toEqual(['3', '5', '0']);

  await user.click(
    getByRole('button', { name: interactionsText.deselectAll() })
  );
  expect(values()).toEqual(['0', '0', '0']);
});
