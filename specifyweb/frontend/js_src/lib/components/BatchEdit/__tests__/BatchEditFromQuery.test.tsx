import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { batchEditText } from '../../../localization/batchEdit';
import { commonText } from '../../../localization/common';
import { queryText } from '../../../localization/query';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import * as ajaxModule from '../../../utils/ajax';
import type { RA } from '../../../utils/types';
import { LoadingContext } from '../../Core/Contexts';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { tables } from '../../DataModel/tables';
import { userPreferences } from '../../Preferences/userPreferences';
import type { QueryField } from '../../QueryBuilder/helpers';
import type { MappingPath } from '../../WbPlanView/Mapper';
import { BatchEditFromQuery } from '../index';

requireContext();

const datasetId = 7;

async function withoutActWarnings(
  callback: () => Promise<void>
): Promise<void> {
  const consoleError = jest.spyOn(console, 'error').mockImplementation();
  try {
    await callback();
  } finally {
    consoleError.mockRestore();
  }
}

overrideAjax('/api/workbench/dataset/?isupdate=1', []);
overrideAjax('/stored_query/batch_edit/', { id: datasetId }, {
  method: 'POST',
});

const queryField = (mappingPath: MappingPath): QueryField => ({
  id: 0,
  mappingPath,
  sortType: undefined,
  isDisplay: true,
  filters: [],
});

const buildQuery = (contextName: string = 'CollectionObject') =>
  new tables.SpQuery.Resource({
    name: 'Test Query',
    contextName,
    contextTableId: tables.CollectionObject.tableId,
  });

function render({
  saveRequired = false,
  baseTableName = 'CollectionObject' as const,
  fields = [queryField(['catalogNumber'])] as RA<QueryField>,
  contextName,
  needsSaved = false,
}: {
  readonly saveRequired?: boolean;
  readonly baseTableName?: 'Collection' | 'CollectionObject';
  readonly fields?: RA<QueryField>;
  readonly contextName?: string;
  readonly needsSaved?: boolean;
} = {}) {
  const query = buildQuery(contextName);
  if (needsSaved) query.set('name', 'Edited but never saved');
  const handleLoading = (promise: Promise<unknown>): void => {
    void promise;
  };
  return mount(
    <MemoryRouter 
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      initialEntries={['/']}
    >
      <UnloadProtectsContext.Provider value={[]}>
        <LoadingContext.Provider value={handleLoading}>
          <Routes>
            <Route
              element={
                <BatchEditFromQuery
                  baseTableName={baseTableName}
                  fields={fields}
                  query={query}
                  saveRequired={saveRequired}
                />
              }
              path="/"
            />
            <Route
              element={<p>Data set opened</p>}
              path="/specify/workbench/:id"
            />
          </Routes>
        </LoadingContext.Provider>
      </UnloadProtectsContext.Provider>
    </MemoryRouter>
  );
}

describe('the Batch Edit button', () => {
  test('is offered for a random query', () => {
    const { getByRole } = render();
    expect(
      getByRole('button', { name: batchEditText.batchEdit() })
    ).toBeEnabled();
  });

  test('is disabled when the query is based on a hierarchy table', () => {
    const { getByRole } = render({
      baseTableName: 'Collection',
      fields: [queryField(['collectionName'])],
    });
    const button = getByRole('button', { name: batchEditText.batchEdit() });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', batchEditText.batchEditDisabled());
  });

  test('is disabled for a query over the audit log', () => {
    const { getByRole } = render({ contextName: 'SpAuditLog' });
    expect(
      getByRole('button', { name: batchEditText.batchEdit() })
    ).toBeDisabled();
  });

  test('creates the data set and opens it', async () => {
    const { getByRole, findByText, user } = render();
    await withoutActWarnings(async () => {
      await user.click(getByRole('button', { name: batchEditText.batchEdit() }));
      expect(await findByText('Data set opened')).toBeInTheDocument();
    });
  });
});

describe('the unsaved query guard', () => {
  test('warns instead of batch editing when the query builder has changes', async () => {
    const { getByRole, queryByText, user } = render({ saveRequired: true });
    await user.click(getByRole('button', { name: batchEditText.batchEdit() }));
    expect(getByRole('dialog')).toHaveTextContent(
      queryText.unsavedChangesInQuery()
    );
    expect(queryByText('Data set opened')).toBeNull();
  });

  test('warns when the query resource itself is unsaved', async () => {
    const { getByRole, user } = render({ needsSaved: true });
    await user.click(getByRole('button', { name: batchEditText.batchEdit() }));
    expect(getByRole('dialog')).toHaveTextContent(
      queryText.unsavedChangesInQuery()
    );
  });

  test('the warning can be dismissed', async () => {
    const { getByRole, queryByRole, user } = render({ saveRequired: true });
    await withoutActWarnings(async () => {
      await user.click(getByRole('button', { name: batchEditText.batchEdit() }));
      await user.click(getByRole('button', { name: commonText.close() }));
      expect(queryByRole('dialog')).toBeNull();
    });
  });
});

// Enable raltionships in user preferences.
function mockEnableRelationships(enabled: boolean): void {
  const realGet = userPreferences.get.bind(userPreferences);
  jest.spyOn(userPreferences, 'get').mockImplementation(((
    category: string,
    subcategory: string,
    item: string
  ) =>
    category === 'batchEdit' &&
    subcategory === 'editor' &&
    item === 'enableRelationships'
      ? enabled
      : realGet(category as never, subcategory as never, item as never)) as never);
}

describe('the enable relationships preference', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each([
    [true, false],
    [false, true],
  ])(
    'enableRelationships=%s asks the back end for omitRelationships=%s',
    async (enableRelationships, omitRelationships) => {
      mockEnableRelationships(enableRelationships);
      const ajax = jest.spyOn(ajaxModule, 'ajax');
      const { getByRole, findByText, user } = render();
      await withoutActWarnings(async () => {
        await user.click(getByRole('button', { name: batchEditText.batchEdit() }));
        expect(await findByText('Data set opened')).toBeInTheDocument();
      });
      expect(ajax).toHaveBeenCalledWith(
        '/stored_query/batch_edit/',
        expect.objectContaining({
          body: expect.objectContaining({ omitrelationships: omitRelationships }),
        })
      );
    }
  );
});
