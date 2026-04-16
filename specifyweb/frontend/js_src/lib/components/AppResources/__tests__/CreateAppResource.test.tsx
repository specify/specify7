import { waitFor } from '@testing-library/react';
import React from 'react';

import { clearIdStore } from '../../../hooks/useId';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { TestComponentWrapperRouter } from '../../../tests/utils';
import { LoadingContext } from '../../Core/Contexts';
import type { SerializedResource } from '../../DataModel/helperTypes';
import type { SpAppResourceDir } from '../../DataModel/types';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { CreateAppResource, exportsForTests } from '../Create';
import { appResourceTypes } from '../types';
import { testAppResources } from './testAppResources';

const { buildNewAppResource } = exportsForTests;

requireContext();

beforeEach(() => {
  // This makes the tests determinstic (otherwise, the run order will affect the IDs)
  clearIdStore();
});

describe('CreateAppResource', () => {
  test('simple no type test', () => {
    const setter = jest.fn();

    const { getByRole } = mount(
      <TestComponentWrapperRouter
        context={{ getSet: [testAppResources, setter] }}
        initialEntries={['/resources/create/discipline_3']}
        path="resources/create/:directoryKey"
      >
        <UnloadProtectsContext.Provider value={[]}>
          <CreateAppResource />
        </UnloadProtectsContext.Provider>
      </TestComponentWrapperRouter>
    );

    expect(getByRole('dialog').textContent).toMatchInlineSnapshot(
      `"Select Resource TypeApp ResourceForm DefinitionCancel"`
    );
  });

  test('simple AppResource type (mimetype undefined)', async () => {
    const setter = jest.fn();

    const { getAllByRole, user, getByRole } = mount(
      <TestComponentWrapperRouter
        context={{ getSet: [testAppResources, setter] }}
        initialEntries={['/resources/create/discipline_3']}
        path="resources/create/:directoryKey"
      >
        <UnloadProtectsContext.Provider value={[]}>
          <CreateAppResource />
        </UnloadProtectsContext.Provider>
      </TestComponentWrapperRouter>
    );

    const appResourceButton = getAllByRole('button')[0];
    await user.click(appResourceButton);

    //  This is a lot more cleaner than the inner HTML
    expect(getByRole('dialog').textContent).toMatchInlineSnapshot(
      `"Select Resource TypeTypeDocumentationLabelDocumentationReportDocumentationDefault User PreferencesDocumentationLeaflet LayersDocumentationRSS Export FeedDocumentationExpress Search ConfigDocumentationType SearchesDocumentationWeb LinksDocumentationField FormattersDocumentationRecord FormattersDocumentationData Entry TablesDocumentationInteractions TablesDocumentationOther XML ResourceOther JSON ResourceOther Properties ResourceOther ResourceCancel"`
    );
  });

  test('simple Form type (mimetype undefined)', async () => {
    const setter = jest.fn();
    const promiseHandler = jest.fn();
    const { getAllByRole, user, getByRole, asFragment } = mount(
      <TestComponentWrapperRouter
        context={{ getSet: [testAppResources, setter] }}
        initialEntries={['/resources/create/discipline_3']}
        path="resources/create/:directoryKey"
      >
        <UnloadProtectsContext.Provider value={[]}>
          <LoadingContext.Provider value={promiseHandler}>
            <CreateAppResource />
          </LoadingContext.Provider>
        </UnloadProtectsContext.Provider>
      </TestComponentWrapperRouter>
    );

    const formButton = getAllByRole('button')[1];
    await user.click(formButton);

    try {
      await waitFor(() => {
        expect(asFragment).toThrowErrorMatchingSnapshot(`<DocumentFragment />`);
      });
    } catch {
      /*
       * This is hacky. Essentially, we want to wait till the dialog gets populated
       * since the useAsyncState won't resolve immediately.
       */
    }

    expect(getByRole('dialog').textContent).toMatchInlineSnapshot(
      `"Copy default formsHerpetologyHerpetology > Guest > HerpetologyHerpetology > Manager > HerpetologyBirdBird > Guest > BirdBird > Manager > BirdMammalMammal > Guest > MammalMammal > Manager > MammalVertpaleoVertpaleo > Guest > VertpaleoVertpaleo > Manager > VertpaleoFishFish > Guest > FishFish > Manager > FishInvertebrateInvertebrate > Guest > InvertebrateInvertebrate > Manager > InvertebrateInsect > EntoInsect > Guest > EntoInsect > Manager > EntoBotanyBotany > Guest > BotanyBotany > Manager > BotanyGeologyCommonBackstop > GlobalBackstop > SearchInvertpaleo > PaleoInvertpaleo > Guest > PaleoInvertpaleo > Manager > PaleoNew"`
    );
  });
});

describe('buildNewAppResource', () => {
  const directory = {
    resource_uri: '/api/specify/spappresourcedir/1/',
  } as SerializedResource<SpAppResourceDir>;

  // Specify 6 hard-fails on labels whose spappresource.Description is NULL,
  // so a freshly created resource must carry a non-null description (#824).
  test('defaults description to the trimmed name', () => {
    const resource = buildNewAppResource(
      appResourceTypes.appResources,
      '  My Label  ',
      'text/xml',
      directory
    );
    expect(resource.get('name')).toBe('My Label');
    expect(resource.get('description')).toBe('My Label');
  });
});
