import { act, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import * as ajaxModule from '../../../utils/ajax';
import { Http } from '../../../utils/ajax/definitions';
import { tables } from '../../DataModel/tables';
import { QueryFieldSpec } from '../../QueryBuilder/fieldSpec';
import { QueryResults } from '../../QueryBuilder/Results';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { ExpressSearchView } from '../ExpressSearchTask';

requireContext();

// Check the search/results boundary; shared controls have their own interaction tests.
jest.mock('../../QueryBuilder/Results', () => ({
  QueryResults: jest.fn(({ table, selectedRows: [, setSelectedRows] }) => (
    <button onClick={() => setSelectedRows(new Set([17]))}>
      Select {table.name}
    </button>
  )),
}));
jest.mock('../../ExpressSearchConfig/ExpressSearchConfigDialog', () => ({
  ExpressSearchConfigDialog: () => null,
}));
// Decorative icons are outside the search/results contract.
jest.mock('../../Atoms/Icons', () => {
  const actual = jest.requireActual('../../Atoms/Icons');
  return {
    ...actual,
    icons: { ...actual.icons, questionCircle: null, x: null },
  };
});

afterEach(() => jest.restoreAllMocks());

test('Simple Search passes records, fields, pagination and independent selections to results', async () => {
  const agentField = {
    stringId: QueryFieldSpec.fromPath('Agent', [
      'lastName',
    ]).toSpQueryAttributes().stringId,
    isRelationship: false,
  };
  const objectField = {
    stringId: QueryFieldSpec.fromPath('CollectionObject', [
      'catalogNumber',
    ]).toSpQueryAttributes().stringId,
    isRelationship: false,
  };
  const primary = {
    totalCount: 2,
    results: [
      [17, 'Darwin'],
      [18, 'Wallace'],
    ],
    fieldSpecs: [agentField],
  };
  const secondary = {
    totalCount: 1,
    results: [[91, 'SPEC-91']],
    definition: {
      name: 'ColObjCollectors',
      root: 'CollectionObject',
      columns: ['catalogNumber'],
      fieldSpecs: [objectField],
      link: null,
    },
  };
  const ajax = jest.spyOn(ajaxModule, 'ajax').mockImplementation(
    async (url) =>
      ({
        status: Http.OK,
        data:
          url === '/context/available_related_searches.json'
            ? ['ColObjCollectors']
            : url.startsWith('/express_search/related/')
              ? secondary
              : { Agent: primary },
      }) as never
  );
  const { user } = mount(<ExpressSearchView />, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={['/specify/express-search/?q=Darwin']}>
        <UnloadProtectsContext.Provider value={[]}>
          {children}
        </UnloadProtectsContext.Provider>
      </MemoryRouter>
    ),
  });
  const latestProps = (name: string) =>
    jest
      .mocked(QueryResults)
      .mock.calls.map(([props]) => props)
      .filter(({ table }) => table.name === name)
      .at(-1)!;
  await waitFor(() => expect(latestProps('CollectionObject')).toBeDefined());
  expect(latestProps('Agent')).toEqual(
    expect.objectContaining({
      table: tables.Agent,
      initialData: primary.results,
      totalCount: 2,
      queryResource: undefined,
    })
  );
  expect(
    latestProps('Agent').fieldSpecs[0].toSpQueryAttributes().stringId
  ).toBe(agentField.stringId);
  expect(latestProps('CollectionObject').initialData).toEqual(
    secondary.results
  );

  // Results are inside collapsible sections.
  screen
    .getByRole('button', { name: 'Select Agent', hidden: true })
    .closest('details')!.open = true;
  await user.click(screen.getByRole('button', { name: 'Select Agent' }));
  expect(Array.from(latestProps('Agent').selectedRows[0])).toEqual([17]);
  expect(latestProps('CollectionObject').selectedRows[0].size).toBe(0);

  await act(async () => {
    expect(await latestProps('Agent').fetchResults?.(40)).toEqual(
      primary.results
    );
    expect(await latestProps('CollectionObject').fetchResults?.(40)).toEqual(
      secondary.results
    );
    expect(await latestProps('CollectionObject').fetchCount?.()).toBe(1);
  });
  const relatedPage = ajax.mock.calls
    .map(([url]) => new URL(url, 'http://localhost'))
    .find(
      (url) =>
        url.pathname === '/express_search/related/' &&
        url.searchParams.get('offset') === '40'
    );
  expect(relatedPage?.searchParams.get('name')).toBe('ColObjCollectors');
  expect(relatedPage?.searchParams.get('q')).toBe('Darwin');
});
