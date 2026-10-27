import { cleanup, waitFor } from '@testing-library/react';
import React from 'react';

import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { tables } from '../../DataModel/tables';
import { collectionPreferences } from '../../Preferences/collectionPreferences';
import { UiField } from '../Field';

requireContext();

overrideAjax(
  '/inheritance/catalog_number_from_parent/',
  JSON.stringify('CO-123'),
  { method: 'POST' }
);

let originalPreferences: ReturnType<typeof collectionPreferences.getRaw>;
beforeEach(() => {
  originalPreferences = collectionPreferences.getRaw();
});
afterEach(() => {
  cleanup();
  collectionPreferences.setRaw(originalPreferences);
});

test.each([false, true])(
  'inheritance=%s leaves the stored value blank',
  async (inheritance) => {
    collectionPreferences.setRaw({
      catalogNumberParentInheritance: { behavior: { inheritance } },
    });
    const component = new tables.Component.Resource(
      {
        id: 101,
        catalogNumber: null,
      },
      { noBusinessRules: true }
    );
    component.set(
      'collectionObject',
      new tables.CollectionObject.Resource({ id: 1 }, { noBusinessRules: true })
    );
    const { getByRole, user } = mount(
      <UiField
        resource={component}
        field={tables.Component.strictGetLiteralField('catalogNumber')}
        id="catalog-number"
        name="catalogNumber"
      />
    );
    const input = getByRole('textbox');
    if (inheritance)
      await waitFor(() =>
        expect(input).toHaveAttribute('placeholder', 'CO-123')
      );
    else expect(input).not.toHaveAttribute('placeholder', 'CO-123');
    // A placeholder is visually subdued and does not become a stored value.
    expect(input).toHaveValue('');
    expect(component.get('catalogNumber')).toBeNull();
    // The inherited value can be overridden by entering an explicit number.
    await user.type(input, 'COMP-456');
    expect(input).toHaveValue('COMP-456');
    expect(component.get('catalogNumber')).toBe('COMP-456');
  }
);

test('explicit number is displayed in preference to inherited placeholder', async () => {
  collectionPreferences.setRaw({
    catalogNumberParentInheritance: { behavior: { inheritance: true } },
  });
  const component = new tables.Component.Resource(
    {
      id: 102,
      catalogNumber: 'COMP-456',
    },
    { noBusinessRules: true }
  );
  component.set(
    'collectionObject',
    new tables.CollectionObject.Resource({ id: 1 }, { noBusinessRules: true })
  );
  const { getByRole } = mount(
    <UiField
      resource={component}
      field={tables.Component.strictGetLiteralField('catalogNumber')}
      id="catalog-number"
      name="catalogNumber"
    />
  );
  await waitFor(() =>
    expect(getByRole('textbox')).toHaveAttribute('placeholder', 'CO-123')
  );
  expect(getByRole('textbox')).toHaveValue('COMP-456');
  expect(component.get('catalogNumber')).toBe('COMP-456');
});
