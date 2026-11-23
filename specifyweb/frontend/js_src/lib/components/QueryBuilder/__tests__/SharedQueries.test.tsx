import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React, { useState as mockUseState } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { queryText } from '../../../localization/query';
import { commonText } from '../../../localization/common';
import { headerText } from '../../../localization/header';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import * as collection from '../../DataModel/collection';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import { getField } from '../../DataModel/helpers';
import type { SpQuery } from '../../DataModel/types';
import type { SpecifyResource } from '../../DataModel/legacyTypes';
import { makeDataViewQuery } from '../../DataViews/queries';
import * as permissions from '../../Permissions/helpers';
import { userInformation } from '../../InitialContext/userInformation';
import { QueryListDialog } from '../../Toolbar/Query';
import { SaveQueryButtons } from '../Components';
import { QueryEditButton } from '../Edit';
import * as filePicker from '../../Molecules/FilePicker';
import { LoadingContext, ReadOnlyContext } from '../../Core/Contexts';
import { QueryBuilder } from '../Wrapped';
import { QueryFields } from '../Fields';
import { QueryFieldSpec } from '../fieldSpec';
import { QueryToolbar } from '../Toolbar';
import {
  SetUnloadProtectsContext,
  UnloadProtectsContext,
} from '../../Router/UnloadProtect';

requireContext();

jest.mock('../../Molecules/AppTitle', () => ({
  ...jest.requireActual('../../Molecules/AppTitle'),
  useTitle: () => undefined,
}));
jest.mock('../../Header/MenuContext', () => ({
  ...jest.requireActual('../../Header/MenuContext'),
  useMenuItem: () => undefined,
}));
jest.mock('../../WbPlanView/MapperComponents', () => ({
  MappingView: () => null,
}));
jest.mock('../CheckReadAccess', () => ({ CheckReadAccess: () => null }));
jest.mock('../Fields', () => ({ QueryFields: jest.fn(() => null) }));
jest.mock('../../Forms/ResourceView', () => ({
  ResourceView: ({
    children,
    onClose,
  }: {
    readonly children: React.ReactNode;
    readonly onClose: () => void;
  }) => (
    <>
      {children}
      <button type="button" onClick={onClose}>
        Close editor
      </button>
    </>
  ),
}));
jest.mock('../Share', () => ({
  QuerySharingActions: ({
    onVersionChange,
  }: {
    readonly onVersionChange: (version: number) => void;
  }) => (
    <button type="button" onClick={() => onVersionChange(7)}>
      Update sharing
    </button>
  ),
}));
jest.mock('../QueryBuilderResults', () => ({
  QueryBuilderResults: () => null,
}));

jest.mock('../../Molecules/Paginator', () => ({
  usePaginator: () => {
    const currentPage = mockUseState(0);
    return {
      currentPage,
      limit: 10,
      offset: currentPage[0] * 10,
      paginator: () => null,
    };
  },
}));

const isAdminDescriptor = Object.getOwnPropertyDescriptor(
  userInformation,
  'isadmin'
);

afterEach(() => {
  jest.restoreAllMocks();
  if (isAdminDescriptor !== undefined)
    Object.defineProperty(userInformation, 'isadmin', isAdminDescriptor);
});

test.each([
  'fields',
  'options',
  'unfinished',
  'clean',
  'conflict',
  'in-flight',
] as const)(
  'sharing refresh reconciles %s changes before the next save',
  async (mode) => {
    jest.spyOn(permissions, 'hasToolPermission').mockReturnValue(true);
    jest.spyOn(permissions, 'hasPermission').mockReturnValue(true);
    const fields = ['lastName', 'firstName'].map((name, index) => {
      const field = QueryFieldSpec.fromPath('Agent', [name]).toSpQueryField();
      field.set('position', index);
      field.set('operStart', 1);
      field.set('startValue', index === 0 ? 'Smith' : 'Alice');
      return serializeResource(field);
    });
    const query = makeDataViewQuery('Agent', {
      fields,
      selectDistinct: false,
      searchSynonymy: false,
      smushed: false,
    });
    query.set('id', 100);
    query.set('version', 1);
    query.set('name', 'Original query');
    query.set('specifyUser', userInformation.resource_uri);
    const server = new tables.SpQuery.Resource<SpQuery>({
      ...serializeResource(query),
      version: 8,
      name: 'Server query',
      fields: fields.map((field, index) =>
        index === 1
          ? {
              ...field,
              id: 201,
              version: 12,
              startValue: 'Bob',
              columnAlias: 'Server alias',
              allowNulls: true,
            }
          : mode === 'conflict'
            ? { ...field, startValue: 'Server filter' }
            : field
      ),
    });
    if (mode === 'unfinished') {
      const added = QueryFieldSpec.fromPath('Agent', [
        'remarks',
      ]).toSpQueryField();
      added.set('position', 2);
      added.set('operStart', 1);
      server.set('fields', [
        ...serializeResource(server).fields,
        serializeResource(added),
      ]);
    }
    const expectedFilters = [
      mode === 'fields' || mode === 'conflict' || mode === 'in-flight'
        ? 'Jones'
        : 'Smith',
      'Bob',
    ];
    const change = jest.fn();
    const setUnloadProtects = jest.fn();
    render(
      <MemoryRouter>
        <LoadingContext.Provider
          value={(promise): void => {
            void promise;
          }}
        >
          <UnloadProtectsContext.Provider value={[]}>
            <SetUnloadProtectsContext.Provider value={setUnloadProtects}>
              <QueryBuilder
                query={query}
                forceCollection={undefined}
                onChange={change}
              />
            </SetUnloadProtectsContext.Provider>
          </UnloadProtectsContext.Provider>
        </LoadingContext.Provider>
      </MemoryRouter>
    );
    await screen.findByRole('button', { name: commonText.edit() });
    await waitFor(() =>
      expect(
        jest.mocked(QueryFields).mock.calls.at(-1)![0].fields
      ).toHaveLength(2)
    );
    const editor = jest.mocked(QueryFields).mock.calls.at(-1)![0];
    await act(async () => {
      if (mode === 'fields' || mode === 'conflict') {
        editor.onChangeField!(0, {
          ...editor.fields[0],
          filters: editor.fields[0].filters.map((filter) => ({
            ...filter,
            startValue: 'Jones',
          })),
        });
        query.set('remarks', 'Unsaved remarks');
      } else if (mode === 'options') {
        fireEvent.click(
          screen.getByRole('checkbox', { name: queryText.distinct() })
        );
      } else if (mode === 'unfinished') {
        editor.onChangeFields!([
          ...editor.fields,
          { ...editor.fields[0], id: 2, mappingPath: ['0'] },
        ]);
      }
      fireEvent.click(screen.getByRole('button', { name: commonText.edit() }));
    });
    let finishReload!: (resource: SpecifyResource<SpQuery>) => void;
    jest.spyOn(tables.SpQuery.Resource.prototype, 'fetch').mockReturnValue(
      new Promise((resolve) => {
        finishReload = resolve;
      })
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Update sharing' }));
    });
    if (mode === 'in-flight') {
      const current = jest.mocked(QueryFields).mock.calls.at(-1)![0];
      await act(async () => {
        current.onChangeField!(0, {
          ...current.fields[0],
          filters: current.fields[0].filters.map((filter) => ({
            ...filter,
            startValue: 'Jones',
          })),
        });
      });
    }
    await act(async () => finishReload(server));
    if (mode === 'conflict') {
      expect(query.get('version')).toBe(1);
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'local' },
      });
      fireEvent.click(screen.getByRole('button', { name: commonText.apply() }));
    }
    expect(query.get('version')).toBe(8);
    expect(query.get('name')).toBe('Server query');
    expect(
      screen.getByRole('heading', { name: /Server query/u })
    ).toBeVisible();
    if (mode === 'unfinished') {
      const refreshedFields = jest.mocked(QueryFields).mock.calls.at(-1)![0]
        .fields;
      expect(refreshedFields).toHaveLength(4);
      expect(new Set(refreshedFields.map(({ id }) => id)).size).toBe(4);
      expect(refreshedFields[3].mappingPath).toEqual(['0']);
      return;
    }
    expect(
      change.mock.calls
        .at(-1)![0]
        .fields.map(
          (field: { readonly startValue: string }) => field.startValue
        )
    ).toEqual(expectedFilters);
    const save = jest
      .spyOn(tables.SpQuery.Resource.prototype, 'save')
      .mockImplementation(async function (this: SpecifyResource<SpQuery>) {
        expect(this).toBe(query);
        expect(this.get('version')).toBe(8);
        expect(this.get('name')).toBe('Server query');
        if (mode === 'fields' || mode === 'conflict')
          expect(this.get('remarks')).toBe('Unsaved remarks');
        expect(this.get('selectDistinct')).toBe(mode === 'options');
        expect(
          serializeResource(this).fields.map(({ startValue }) => startValue)
        ).toEqual(expectedFilters);
        expect(serializeResource(this).fields[1]).toMatchObject({
          id: 201,
          version: 12,
          columnAlias: 'Server alias',
          allowNulls: true,
        });
        return this;
      });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Close editor' }));
    });
    const saveButton = screen.getByRole('button', {
      name: queryText.saveQuery(),
    });
    if (mode === 'clean') {
      await waitFor(() => expect(saveButton).toBeDisabled());
      expect(setUnloadProtects).not.toHaveBeenCalled();
      return;
    }
    await waitFor(() => expect(saveButton).toBeEnabled());
    expect(setUnloadProtects.mock.calls.at(-1)![0]([])).toContain(
      queryText.queryUnloadProtect()
    );
    await act(async () => {
      fireEvent.click(saveButton);
    });
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  }
);

test('switches between personal, incoming shared, and outgoing shared query filters', async () => {
  Object.defineProperty(userInformation, 'isadmin', {
    configurable: true,
    value: false,
  });
  const fetch = jest.spyOn(collection, 'fetchCollection').mockResolvedValue({
    records: [],
    totalCount: 0,
  });
  render(
    <QueryListDialog newQueryUrl="/specify/query/new/" onClose={jest.fn()}>
      {({ children }) => children}
    </QueryListDialog>
  );
  await waitFor(() =>
    expect(fetch).toHaveBeenLastCalledWith(
      'SpQuery',
      expect.objectContaining({ specifyUser: userInformation.id }),
      expect.objectContaining({ share_grants__isnull: 'true' })
    )
  );
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: queryText.sharedQueries() })
    );
  });
  expect(fetch).toHaveBeenLastCalledWith(
    'SpQuery',
    expect.not.objectContaining({ specifyUser: userInformation.id }),
    expect.objectContaining({ share_grants__recipient: userInformation.id })
  );
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: queryText.queriesIShare() })
    );
  });
  expect(fetch).toHaveBeenLastCalledWith(
    'SpQuery',
    expect.objectContaining({ specifyUser: userInformation.id }),
    expect.objectContaining({ share_grants__isnull: 'false' })
  );
});

test('shared originals retain exports and Save As in read-only mode', () => {
  const query = new tables.SpQuery.Resource<SpQuery>({
    id: 100,
    specifyUser: `/api/specify/specifyuser/${userInformation.id + 1}/`,
  });
  render(
    <MemoryRouter>
      <UnloadProtectsContext.Provider value={[]}>
        <ReadOnlyContext.Provider value>
          <QueryEditButton queryResource={query} onRefresh={jest.fn()} />
          <SaveQueryButtons
            canCloneShared
            fields={[]}
            getQueryFieldRecords={undefined}
            isValid={() => true}
            queryResource={query}
            saveRequired
            unsetUnloadProtect={jest.fn()}
            onSaved={jest.fn()}
            onTriedToSave={() => true}
          />
        </ReadOnlyContext.Provider>
      </UnloadProtectsContext.Provider>
    </MemoryRouter>
  );
  expect(
    screen.queryByRole('button', { name: queryText.saveQuery() })
  ).not.toBeInTheDocument();
  expect(screen.getAllByRole('button')).toHaveLength(2);
  expect(
    screen.queryByRole('button', { name: commonText.edit() })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: commonText.export() })
  ).toBeVisible();
  expect(
    screen.getByRole('button', { name: queryText.saveAs() })
  ).toBeVisible();
});

overrideAjax('/export/extract_query/100/', '<query />');

test.each(['json', 'dwca', 'report', 'label'] as const)(
  'non-owners can export %s without editing or sharing controls',
  async (format) => {
    jest.spyOn(permissions, 'hasPermission').mockReturnValue(true);
    const download = jest
      .spyOn(filePicker, 'downloadFile')
      .mockResolvedValue(undefined);
    const query = new tables.SpQuery.Resource<SpQuery>({
      id: 100,
      name: 'Shared query',
      specifyUser: `/api/specify/specifyuser/${userInformation.id + 1}/`,
    });
    render(
      <MemoryRouter>
        <LoadingContext.Provider
          value={(promise): void => {
            void promise;
          }}
        >
          <UnloadProtectsContext.Provider value={[]}>
            <ReadOnlyContext.Provider value>
              <QueryEditButton queryResource={query} onRefresh={jest.fn()} />
            </ReadOnlyContext.Provider>
          </UnloadProtectsContext.Provider>
        </LoadingContext.Provider>
      </MemoryRouter>
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: commonText.export() })
      );
    });
    expect(
      screen.queryByRole('button', { name: commonText.save() })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: commonText.delete() })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: queryText.shareQuery() })
    ).not.toBeInTheDocument();
    const action = {
      json: commonText.export(),
      dwca: queryText.exportQueryForDwca(),
      report: queryText.exportQueryAsReport(),
      label: queryText.exportQueryAsLabel(),
    }[format];
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: action }).at(-1)!);
    });
    if (format === 'json') {
      expect(download).toHaveBeenCalledWith(
        'Shared query.json',
        expect.any(String)
      );
    } else if (format === 'dwca') {
      expect(await screen.findByRole('textbox')).toHaveValue('<query />');
    } else {
      expect(
        await screen.findByRole('textbox', {
          name:
            format === 'label'
              ? headerText.labelName()
              : headerText.reportName(),
        })
      ).toBeVisible();
    }
  }
);

test('read-only definitions allow query execution but cannot change distinct, series, or synonyms', async () => {
  const toggle = jest.fn();
  const toggleSeries = jest.fn();
  const toggleSearchSynonymy = jest.fn();
  const run = jest.fn();
  render(
    <ReadOnlyContext.Provider value>
      <QueryToolbar
        isDistinct={false}
        isEmbedded={false}
        isSeries={false}
        searchSynonymy={false}
        showHiddenFields={false}
        showSeries
        tableName="CollectionObject"
        onScheduleCountOnlyRun={jest.fn()}
        onScheduleRun={run}
        onSubmitClick={run}
        onToggleDistinct={toggle}
        onToggleHidden={jest.fn()}
        onToggleSearchSynonymy={toggleSearchSynonymy}
        onToggleSeries={toggleSeries}
      />
    </ReadOnlyContext.Provider>
  );
  await act(async () => {
    fireEvent.click(
      screen.getByRole('checkbox', { name: queryText.distinct() })
    );
    fireEvent.click(screen.getByRole('checkbox', { name: queryText.series() }));
    fireEvent.click(
      screen.getByRole('checkbox', { name: queryText.searchSynonyms() })
    );
    fireEvent.click(screen.getByRole('button', { name: queryText.query() }));
  });
  expect(toggle).not.toHaveBeenCalled();
  expect(toggleSeries).not.toHaveBeenCalled();
  expect(toggleSearchSynonymy).not.toHaveBeenCalled();
  expect(run).toHaveBeenCalledTimes(1);
});

test('shared query notice remains visible when cloning is not permitted', async () => {
  jest.spyOn(permissions, 'hasToolPermission').mockReturnValue(false);
  jest.spyOn(permissions, 'hasPermission').mockReturnValue(true);
  const query = makeDataViewQuery('Agent', {
    fields: [],
    selectDistinct: false,
    searchSynonymy: false,
    smushed: false,
  });
  query.set('id', 100);
  query.set('name', 'Shared agents');
  query.set(
    'specifyUser',
    `/api/specify/specifyuser/${userInformation.id + 1}/`
  );

  render(
    <MemoryRouter>
      <LoadingContext.Provider
        value={(promise): void => {
          void promise;
        }}
      >
        <UnloadProtectsContext.Provider value={[]}>
          <QueryBuilder forceCollection={undefined} query={query} />
        </UnloadProtectsContext.Provider>
      </LoadingContext.Provider>
    </MemoryRouter>
  );

  expect(
    await screen.findByText(queryText.sharedQueryReadOnly())
  ).toBeVisible();
  expect(
    screen.queryByText(queryText.sharedQuerySaveCopy())
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: queryText.saveAs() })
  ).not.toBeInTheDocument();
});

test('shared QueryBuilder enables Save As through the Header gate and saves a personal copy', async () => {
  jest
    .spyOn(permissions, 'hasToolPermission')
    .mockImplementation(
      (tool, action) => tool === 'queryBuilder' && action === 'create'
    );
  jest.spyOn(permissions, 'hasPermission').mockReturnValue(true);
  const field = QueryFieldSpec.fromPath('Agent', ['lastName']).toSpQueryField();
  field.set('operStart', 1);
  field.set('startValue', 'Smith');
  const query = makeDataViewQuery('Agent', {
    fields: [serializeResource(field)],
    selectDistinct: false,
    searchSynonymy: false,
    smushed: false,
  });
  query.set('id', 100);
  query.set('name', 'Shared agents');
  query.set(
    'specifyUser',
    `/api/specify/specifyuser/${userInformation.id + 1}/`
  );
  const originalOwner = query.get('specifyUser');
  let saved: SpecifyResource<SpQuery> | undefined;
  const save = jest
    .spyOn(tables.SpQuery.Resource.prototype, 'save')
    .mockImplementation(async function (this: SpecifyResource<SpQuery>) {
      saved = this;
      this.set('id', 101);
      return this;
    });

  render(
    <MemoryRouter>
      <LoadingContext.Provider
        value={(promise): void => {
          void promise;
        }}
      >
        <UnloadProtectsContext.Provider value={[]}>
          <QueryBuilder forceCollection={undefined} query={query} />
        </UnloadProtectsContext.Provider>
      </LoadingContext.Provider>
    </MemoryRouter>
  );

  const saveAs = await screen.findByRole('button', {
    name: queryText.saveAs(),
  });
  expect(saveAs).toBeEnabled();
  expect(screen.getByText(queryText.sharedQueryReadOnly())).toBeVisible();
  expect(
    screen.queryByRole('button', { name: queryText.saveQuery() })
  ).not.toBeInTheDocument();
  await act(async () => {
    fireEvent.click(saveAs);
  });
  const nameInput = await screen.findByRole('textbox', {
    name: getField(tables.SpQuery, 'name').label,
  });
  await act(async () => {
    fireEvent.change(nameInput, { target: { value: 'My agents' } });
    fireEvent.click(screen.getByRole('button', { name: commonText.save() }));
  });

  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(saved).toBeDefined();
  if (saved === undefined) throw new Error('Personal copy was not saved');
  expect(saved).not.toBe(query);
  expect(saved.get('name')).toBe('My agents');
  expect(saved.get('specifyUser')).toBe(userInformation.resource_uri);
  expect(serializeResource(saved).fields).toEqual(
    expect.arrayContaining([expect.objectContaining({ startValue: 'Smith' })])
  );
  expect(query.id).toBe(100);
  expect(query.get('specifyUser')).toBe(originalOwner);
});
