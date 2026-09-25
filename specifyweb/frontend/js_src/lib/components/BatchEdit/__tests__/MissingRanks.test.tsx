import { within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { batchEditText } from '../../../localization/batchEdit';
import { interactionsText } from '../../../localization/interactions';
import { overrideAjax } from '../../../tests/ajax';
import specifyTrees from '../../../tests/ajax/static/trees/specify_trees.json';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import * as ajaxModule from '../../../utils/ajax';
import type { RA } from '../../../utils/types';
import { LoadingContext } from '../../Core/Contexts';
import { tables } from '../../DataModel/tables';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { formatTreeRank } from '../../WbPlanView/mappingHelpers';
import { BatchEditFromQuery } from '../index';

const [taxonomy] = specifyTrees.Taxon;
const plantTreeUri = '/api/specify/taxontreedef/2/';
const plantTaxonomy = {
  definition: {
    ...taxonomy.definition,
    id: 2,
    name: 'Plant Taxonomy',
    resource_uri: plantTreeUri,
  },
  ranks: taxonomy.ranks
    .filter(({ name }) =>
      ['Taxonomy Root', 'Kingdom', 'Genus', 'Species'].includes(name)
    )
    .map((rank) => ({
      ...rank,
      id: rank.id + 100,
      treedef: plantTreeUri,
      resource_uri: `/api/specify/taxontreedefitem/${rank.id + 100}/`,
    })),
};

overrideAjax('/trees/specify_trees/', {
  ...specifyTrees,
  Taxon: [taxonomy, plantTaxonomy],
});

requireContext();

overrideAjax('/api/workbench/dataset/?isupdate=1', []);
overrideAjax('/stored_query/batch_edit/', { id: 7 }, { method: 'POST' });

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

function renderGenusQuery() {
  const query = new tables.SpQuery.Resource({
    name: 'Test Query',
    contextName: 'Taxon',
    contextTableId: tables.Taxon.tableId,
  });
  const handleLoading = (promise: Promise<unknown>): void => {
    void promise;
  };
  return mount(
    <MemoryRouter initialEntries={['/']}>
      <UnloadProtectsContext.Provider value={[]}>
        <LoadingContext.Provider value={handleLoading}>
          <Routes>
            <Route
              element={
                <BatchEditFromQuery
                  baseTableName="Taxon"
                  fields={[
                    {
                      id: 0,
                      mappingPath: [formatTreeRank('Genus'), 'name'],
                      sortType: undefined,
                      isDisplay: true,
                      filters: [],
                    },
                  ]}
                  query={query}
                  saveRequired={false}
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

// Open the dialog, click each named tree's checkbox in turn, then continue
async function continueWithTrees(...trees: RA<string>) {
  const ajax = jest.spyOn(ajaxModule, 'ajax');
  const { getByRole, findByRole, findByText, user } = renderGenusQuery();
  await withoutActWarnings(async () => {
    await user.click(getByRole('button', { name: batchEditText.batchEdit() }));
    const dialog = await findByRole('dialog');
    for (const tree of trees)
      await user.click(
        within(dialog).getByRole('checkbox', { name: `${tree}:` })
      );
    await user.click(
      within(dialog).getByRole('button', { name: interactionsText.continue() })
    );
    await findByText('Data set opened');
  });
  return ajax;
}

const expectTreeFilter = (
  ajax: jest.SpyInstance,
  treedefsfilter: unknown
): void =>
  expect(ajax).toHaveBeenCalledWith(
    '/stored_query/batch_edit/',
    expect.objectContaining({
      body: expect.objectContaining({ treedefsfilter }),
    })
  );

describe('picking trees in the missing rank dialog', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('offers a checkbox for each tree the rank is in', async () => {
    const { getByRole, findByRole, user } = renderGenusQuery();
    await withoutActWarnings(async () => {
      await user.click(getByRole('button', { name: batchEditText.batchEdit() }));
      const dialog = await findByRole('dialog');
      expect(dialog).toHaveTextContent(batchEditText.pickTreesToFilter());
      expect(
        within(dialog).getByRole('checkbox', { name: 'Taxonomy:' })
      ).toBeInTheDocument();
      expect(
        within(dialog).getByRole('checkbox', { name: 'Plant Taxonomy:' })
      ).toBeInTheDocument();
    });
  });

  test('sends only the tree that was picked', async () => {
    const ajax = await continueWithTrees('Plant Taxonomy');
    expectTreeFilter(ajax, { taxon: [2] });
  });

  test('sends every tree that was picked', async () => {
    const ajax = await continueWithTrees('Taxonomy', 'Plant Taxonomy');
    expectTreeFilter(ajax, { taxon: [1, 2] });
  });

  test('clicking a picked tree again removes it', async () => {
    const ajax = await continueWithTrees(
      'Plant Taxonomy',
      'Taxonomy',
      'Plant Taxonomy'
    );
    expectTreeFilter(ajax, { taxon: [1] });
  });

  test('sends no filter when no tree is picked', async () => {
    const ajax = await continueWithTrees();
    expectTreeFilter(ajax, {});
  });
});
