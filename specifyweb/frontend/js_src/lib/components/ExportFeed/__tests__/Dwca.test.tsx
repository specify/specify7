import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { resourcesText } from '../../../localization/resources';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { localized } from '../../../utils/types';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { PickAppResource, dwcaAppResourceFilter } from '../Dwca';
import { testAppResources } from '../../AppResources/__tests__/testAppResources';

requireContext();

test('searches resources in the DwCA resource picker', async () => {
  const { getByRole, queryByRole, user } = mount(
    <MemoryRouter>
      <UnloadProtectsContext.Provider value={[]}>
        <PickAppResource
          filters={dwcaAppResourceFilter}
          header={localized('Choose resource')}
          resources={testAppResources}
          onClose={jest.fn()}
          onSelected={jest.fn()}
        />
      </UnloadProtectsContext.Provider>
    </MemoryRouter>
  );

  const search = getByRole('searchbox', {
    name: resourcesText.searchResources(),
  });
  await user.type(search, 'QueryExtra');

  expect(getByRole('link', { name: 'QueryExtraList' })).toBeInTheDocument();
  expect(
    queryByRole('link', { name: 'QueryFreqList' })
  ).not.toBeInTheDocument();
});
