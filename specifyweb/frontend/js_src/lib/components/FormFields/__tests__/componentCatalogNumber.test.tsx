import { act, cleanup, waitFor } from '@testing-library/react';
import React from 'react';

import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import * as ajaxModule from '../../../utils/ajax';
import { Http } from '../../../utils/ajax/definitions';
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
  jest.restoreAllMocks();
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

test('explicit number is displayed without an inherited placeholder', async () => {
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
  const originalAjax = ajaxModule.ajax;
  const request = jest
    .spyOn(ajaxModule, 'ajax')
    .mockImplementation(
      async <RESPONSE_TYPE,>(
        url: string,
        options: Parameters<typeof ajaxModule.ajax>[1]
      ): Promise<ajaxModule.AjaxResponseObject<RESPONSE_TYPE>> => {
        if (url !== '/inheritance/catalog_number_from_parent/')
          return originalAjax<RESPONSE_TYPE>(url, options);
        const body = JSON.parse(JSON.stringify(options.body));
        return {
          data: (body.catalognumber == null ? 'CO-123' : null) as RESPONSE_TYPE,
          status: Http.OK,
          response: new Response('', { status: Http.OK }),
        };
      }
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
    expect(request).toHaveBeenCalledWith(
      '/inheritance/catalog_number_from_parent/',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({ catalognumber: 'COMP-456' }),
      })
    )
  );
  await act(async () => {
    await Promise.all(request.mock.results.map(({ value }) => value));
  });
  expect(getByRole('textbox')).toHaveValue('COMP-456');
  expect(getByRole('textbox')).not.toHaveAttribute('placeholder');
  expect(component.get('catalogNumber')).toBe('COMP-456');
});
