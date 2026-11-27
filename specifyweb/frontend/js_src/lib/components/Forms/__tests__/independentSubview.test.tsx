import { screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { LoadingContext } from '../../Core/Contexts';
import { addMissingFields } from '../../DataModel/addMissingFields';
import type { SpecifyResource } from '../../DataModel/legacyTypes';
import { tables } from '../../DataModel/tables';
import type { CollectingEvent, Locality } from '../../DataModel/types';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import type * as generators from '../generateFormDefinition';
import { SubView } from '../SubView';
import type * as viewDefinitions from '../useViewDefinition';

const mockLocalityId = 123;
const mockSave = jest.fn(
  async (
    resource: SpecifyResource<Locality>
  ): Promise<SpecifyResource<Locality>> => {
    await Promise.resolve();
    return resource;
  }
);

const MemoryRouterWithFuture = MemoryRouter as unknown as React.ComponentType<
  React.ComponentProps<typeof MemoryRouter> & {
    readonly future: {
      readonly v7_startTransition: boolean;
      readonly v7_relativeSplatPath: boolean;
    };
  }
>;

jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasTablePermission: (): boolean => true,
}));

jest.mock('../useViewDefinition', () => {
  const mockActual = jest.requireActual<typeof viewDefinitions>(
    '../useViewDefinition'
  );
  const mockGenerate = jest.requireActual<typeof generators>(
    '../generateFormDefinition'
  ).autoGenerateViewDefinition;
  return {
    ...mockActual,
    useViewDefinition: ({
      table,
      formType,
      mode,
    }: Parameters<typeof viewDefinitions.useViewDefinition>['0']): ReturnType<
      typeof viewDefinitions.useViewDefinition
    > =>
      table === undefined
        ? undefined
        : mockGenerate(table, formType, mode, ['localityName'] as never),
  };
});

jest.mock('../Save', () => {
  const mockReact = jest.requireActual<typeof React>('react');
  return {
    SaveButton: ({
      resource,
      onSaved,
    }: {
      readonly resource: SpecifyResource<Locality>;
      readonly onSaved?: () => void;
    }): React.ReactElement => {
      jest
        .spyOn(resource, 'save')
        .mockImplementation(async () => mockSave(resource));
      return mockReact.createElement(
        'button',
        {
          type: 'button',
          onClick: async () => {
            await resource.save();
            onSaved?.();
          },
        },
        'Save locality'
      );
    },
  };
});

requireContext();
overrideAjax('/api/specify/locality/123/', () =>
  addMissingFields('Locality', {
    id: 123,
    localityName: 'Lawrence',
    resource_uri: '/api/specify/locality/123/',
  })
);

const portalRoot = document.createElement('div');
beforeAll(() => {
  portalRoot.id = 'portal-root';
  document.body.append(portalRoot);
});
beforeEach(() => mockSave.mockClear());
afterEach(() => jest.restoreAllMocks());
afterAll(() => portalRoot.remove());

function renderIndependentSubview(
  collectingEvent: SpecifyResource<CollectingEvent>
): ReturnType<typeof mount> {
  const relationship = tables.CollectingEvent.strictGetRelationship('locality');
  return mount(
    <MemoryRouterWithFuture
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <UnloadProtectsContext.Provider value={[]}>
        <LoadingContext.Provider value={(promise) => void promise}>
          <SubView
            formType="form"
            icon={undefined}
            isButton={false}
            parentFormType="form"
            parentResource={collectingEvent}
            relationship={relationship}
            sortField={undefined}
            viewName="IndependentLocalityTest"
          />
        </LoadingContext.Provider>
      </UnloadProtectsContext.Provider>
    </MemoryRouterWithFuture>
  );
}

test('creates and links a saved Locality through an independent subview', async () => {
  const collectingEvent = new tables.CollectingEvent.Resource(
    {},
    { noBusinessRules: true }
  );
  const relationship = tables.CollectingEvent.strictGetRelationship('locality');
  mockSave.mockImplementation(async (resource: SpecifyResource<Locality>) => {
    await Promise.resolve();
    resource.set('id', mockLocalityId);
    return resource;
  });
  const { user } = renderIndependentSubview(collectingEvent);
  expect(relationship.isDependent()).toBe(false);
  await user.click(await screen.findByRole('button', { name: 'Add' }));
  await user.type(
    await screen.findByRole('textbox', { name: 'Locality Name' }),
    'Lawrence'
  );
  await expect(collectingEvent.rgetPromise('locality')).resolves.toBeNull();
  expect(mockSave).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Save locality' }));
  await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
  const locality = await collectingEvent.rgetPromise('locality');
  expect({
    id: locality?.id,
    name: locality?.get('localityName'),
    isNew: locality?.isNew(),
  }).toEqual({ id: 123, name: 'Lawrence', isNew: false });
  await expect(
    screen.findByRole('textbox', { name: 'Locality Name' })
  ).resolves.toHaveValue('Lawrence');
});

overrideAjax('/express_search/querycbx/locality/?localityname=Lawrence', () => [
  addMissingFields('Locality', {
    id: mockLocalityId,
    localityName: 'Lawrence',
    resource_uri: '/api/specify/locality/123/',
  }),
]);

test('links an existing Locality selected through independent subview search', async () => {
  const collectingEvent = new tables.CollectingEvent.Resource(
    {},
    { noBusinessRules: true }
  );
  const { user } = renderIndependentSubview(collectingEvent);
  await user.click(await screen.findByRole('button', { name: 'Search' }));
  const searchDialog = await screen.findByRole('dialog', { name: 'Search' });
  await user.type(
    within(searchDialog).getByRole('textbox', { name: 'Locality Name' }),
    'Lawrence'
  );
  await user.click(
    within(searchDialog).getByRole('button', { name: 'Search' })
  );
  const result = await within(searchDialog).findByRole('link', {
    name: 'Lawrence',
  });
  await expect(collectingEvent.rgetPromise('locality')).resolves.toBeNull();
  await user.click(result);
  const locality = await collectingEvent.rgetPromise('locality');
  expect({
    id: locality?.id,
    name: locality?.get('localityName'),
    isNew: locality?.isNew(),
  }).toEqual({ id: mockLocalityId, name: 'Lawrence', isNew: false });
  expect(mockSave).not.toHaveBeenCalled();
  expect(
    screen.queryByRole('dialog', { name: 'Search' })
  ).not.toBeInTheDocument();
  await expect(
    screen.findByRole('textbox', { name: 'Locality Name' })
  ).resolves.toHaveValue('Lawrence');
});
