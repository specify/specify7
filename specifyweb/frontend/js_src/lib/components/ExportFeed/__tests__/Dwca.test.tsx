import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { resourcesText } from '../../../localization/resources';
import { backEndText } from '../../../localization/backEnd';
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
import {
  formatJsonBackendResponse,
  resolveBackendLocalization,
} from '../../Errors/JsonError';
import {
  notificationRenderers,
  type GenericNotification,
} from '../../Notifications/NotificationRenderers';

requireContext();

test('resolves DwCA validation keys and preserves unknown error messages', () => {
  const keys = [
    'dwcaMissingRowType',
    'dwcaMissingQueries',
    'dwcaConflictingFields',
    'dwcaMissingIdField',
    'dwcaMultipleIdFields',
    'dwcaMissingQueryTableOrFile',
    'dwcaEmptyFileName',
    'dwcaInvalidFileName',
    'dwcaInvalidQueryAttributes',
    'dwcaDuplicateCoreIdentifier',
    'dwcaOneCoreRequired',
    'dwcaInvalidCoreIdentifier',
    'dwcaMissingCoreFieldTerm',
    'dwcaInvalidExtensionIdentifier',
    'dwcaMissingExtensionFieldTerm',
    'dwcaInvalidXml',
    'dwcaInvalidDefinitionAttributes',
    'dwcaIncorrectBaseTable',
    'dwcaReservedFileName',
    'dwcaDuplicateFileName',
  ];
  keys.forEach((localizationKey) =>
    expect(
      resolveBackendLocalization({
        localizationKey,
        message: 'Fallback message',
        identifierTerm: 'occurrenceID',
      })
    ).not.toBe('Fallback message')
  );
  expect(
    resolveBackendLocalization({
      localizationKey: 'unknown',
      message: 'Fallback message',
    })
  ).toBe('Fallback message');
  const { getByText } = mount(
    formatJsonBackendResponse(
      JSON.stringify({
        exception: 'DwCAException',
        message: 'Fallback message',
        data: {
          localizationKey: 'dwcaInvalidXml',
          message: 'Fallback message',
        },
      })
    )
  );
  expect(getByText(backEndText.dwcaInvalidXml())).toBeInTheDocument();
});

test.each(['dwca-export-failed', 'update-feed-failed'])(
  'localizes DwCA errors in %s notifications',
  (type) => {
    const notification: GenericNotification = {
      messageId: '1',
      read: false,
      timestamp: '2023-01-01',
      type,
      payload: {
        localizationKey: localized('dwcaDuplicateCoreIdentifier'),
        identifierTerm: localized('occurrenceID'),
        message: localized('Fallback message'),
      },
    };
    const { getByText } = mount(
      <>{notificationRenderers[type](notification)}</>
    );
    expect(
      getByText(
        backEndText.dwcaDuplicateCoreIdentifier({
          identifierTerm: 'occurrenceID',
        })
      )
    ).toBeInTheDocument();
  }
);

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
