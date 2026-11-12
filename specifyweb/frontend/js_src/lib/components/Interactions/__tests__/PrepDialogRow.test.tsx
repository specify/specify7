import React from 'react';

import { interactionsText } from '../../../localization/interactions';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import type { PreparationData } from '../helpers';
import { PrepDialogRow } from '../PrepDialogRow';

jest.mock('../../Formatters/fieldFormat', () => ({
  syncFieldFormat: (_field: unknown, value: string) => value,
}));

jest.mock('../../Molecules/FormattedResource', () => ({
  FormattedResource: () => null,
}));

requireContext();

const preparation = (available: number): PreparationData => ({
  catalogNumber: '1',
  collectionObjectId: 1,
  taxon: 'Test taxon',
  taxonId: 1,
  preparationId: 1,
  prepType: 'Fluid',
  countAmount: available,
  loaned: 0,
  gifted: 0,
  exchanged: 0,
  available,
});

test('checkbox selects all available for the row', async () => {
  const handleChange = jest.fn();
  const { getByRole, rerender, user } = mount(
    <table>
      <tbody>
        <PrepDialogRow
          preparation={preparation(5)}
          selected={0}
          onChange={handleChange}
        />
      </tbody>
    </table>
  );

  await user.click(getByRole('checkbox', { name: interactionsText.selectAll() }));
  expect(handleChange).toHaveBeenLastCalledWith(5);

  rerender(
    <table>
      <tbody>
        <PrepDialogRow
          preparation={preparation(5)}
          selected={5}
          onChange={handleChange}
        />
      </tbody>
    </table>
  );
  await user.click(getByRole('checkbox', { name: interactionsText.selectAll() }));
  expect(handleChange).toHaveBeenLastCalledWith(0);
});
