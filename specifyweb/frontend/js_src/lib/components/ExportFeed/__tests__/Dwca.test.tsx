import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { resourcesText } from '../../../localization/resources';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { localized } from '../../../utils/types';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { PickAppResource, dwcaAppResourceFilter } from '../Dwca';
import { MakeDwcaOverlay } from '../Dwca';
import * as resourceHooks from '../../AppResources/hooks';
import * as pingModule from '../../../utils/ajax/ping';
import { LoadingContext } from '../../Core/Contexts';
import { act } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { headerText } from '../../../localization/header';
import { testAppResources } from '../../AppResources/__tests__/testAppResources';

requireContext();

test('shows export started only on success and keeps the metadata picker after rejection', async () => {
  jest
    .spyOn(resourceHooks, 'useAppResources')
    .mockReturnValue([testAppResources, jest.fn()]);
  let finish: () => void = () => undefined;
  let fail: (error: Error) => void = () => undefined;
  const request = new Promise<number>((resolve, reject) => {
    finish = () => resolve(200);
    fail = reject;
  });
  const ping = jest.spyOn(pingModule, 'ping').mockReturnValueOnce(request);
  const { user, getByRole, queryByRole } = mount(
    <MemoryRouter>
      <UnloadProtectsContext.Provider value={[]}>
        <LoadingContext.Provider
          value={(promise) => void promise.catch(() => undefined)}
        >
          <MakeDwcaOverlay />
        </LoadingContext.Provider>
      </UnloadProtectsContext.Provider>
    </MemoryRouter>
  );
  await user.click(getByRole('link', { name: 'QueryExtraList' }));
  await user.click(getByRole('button', { name: commonText.skip() }));
  expect(
    queryByRole('dialog', { name: headerText.dwcaExportStarted() })
  ).not.toBeInTheDocument();
  await act(async () => fail(new Error('Invalid definition')));
  expect(
    getByRole('dialog', { name: headerText.chooseMetadataResource() })
  ).toBeInTheDocument();
  const success = new Promise<number>((resolve) => {
    finish = () => resolve(200);
  });
  ping.mockReturnValueOnce(success);
  await user.click(getByRole('button', { name: commonText.skip() }));
  await act(async () => finish());
  expect(
    getByRole('dialog', { name: headerText.dwcaExportStarted() })
  ).toBeInTheDocument();
});

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
