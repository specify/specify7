import { renderHook, waitFor } from '@testing-library/react';

import { requireContext } from '../../../tests/helpers';
import * as ajaxModule from '../../../utils/ajax';
import { Http } from '../../../utils/ajax/definitions';
import { tables } from '../../DataModel/tables';
import { usePrimarySearch, useSecondarySearch } from '../ExpressSearchHooks';

requireContext();

afterEach(() => jest.restoreAllMocks());

const primary = {
  totalCount: 1,
  results: [[17, 'Darwin']],
  fieldSpecs: [],
};
const secondary = {
  totalCount: 1,
  results: [[91, 'SPEC-91']],
  definition: {
    root: 'CollectionObject',
    name: 'ColObjCollectors',
    columns: ['catalogNumber'],
    fieldSpecs: [],
    link: null,
  },
};

function mockSearch() {
  return jest.spyOn(ajaxModule, 'ajax').mockImplementation(async (url) => {
    const isWallace =
      new URL(url, 'http://localhost').searchParams.get('q') === 'Wallace';
    return {
      data:
        url === '/context/available_related_searches.json'
          ? ['ColObjCollectors']
          : url.startsWith('/express_search/related/')
            ? {
                ...secondary,
                results: isWallace ? [[92, 'SPEC-92']] : secondary.results,
              }
            : {
                Agent: {
                  ...primary,
                  results: isWallace ? [[18, 'Wallace']] : primary.results,
                },
                Taxon: { ...primary, totalCount: 0, results: [] },
              },
      status: Http.OK,
    } as never;
  });
}

test('primary and secondary searches retain distinct records, tables and endpoints', async () => {
  const ajax = mockSearch();
  const { result, rerender } = renderHook(
    ({ query, refresh }) => ({
      primary: usePrimarySearch(query, refresh),
      secondary: useSecondarySearch(query, refresh),
    }),
    { initialProps: { query: 'Darwin', refresh: 0 } }
  );
  await waitFor(() => {
    expect(result.current.primary).toEqual([
      expect.objectContaining({ table: tables.Agent, tableResults: primary }),
    ]);
    expect(result.current.secondary).toEqual([
      expect.objectContaining({
        table: tables.CollectionObject,
        tableResults: {
          results: secondary.results,
          totalCount: 1,
          fieldSpecs: [],
        },
      }),
    ]);
  });
  const urls = () =>
    ajax.mock.calls.map(([url]) => new URL(url, 'http://localhost'));
  expect(
    urls().some(
      (url) =>
        url.pathname === '/express_search/' &&
        url.searchParams.get('q') === 'Darwin'
    )
  ).toBe(true);
  expect(
    urls().some(
      (url) =>
        url.pathname === '/express_search/related/' &&
        url.searchParams.get('name') === 'ColObjCollectors'
    )
  ).toBe(true);

  ajax.mockClear();
  rerender({ query: 'Wallace', refresh: 0 });
  await waitFor(() =>
    expect(
      urls().filter((url) => url.searchParams.get('q') === 'Wallace')
    ).toHaveLength(2)
  );
  await waitFor(() => {
    expect(result.current.primary).toEqual([
      expect.objectContaining({
        tableResults: expect.objectContaining({ results: [[18, 'Wallace']] }),
      }),
    ]);
    expect(result.current.secondary).toEqual([
      expect.objectContaining({
        tableResults: expect.objectContaining({ results: [[92, 'SPEC-92']] }),
      }),
    ]);
  });
  ajax.mockClear();
  rerender({ query: 'Wallace', refresh: 1 });
  await waitFor(() =>
    expect(
      urls().filter((url) => url.searchParams.get('q') === 'Wallace')
    ).toHaveLength(2)
  );
});

test('empty query performs neither search', async () => {
  const ajax = mockSearch();
  const { result } = renderHook(() => [
    usePrimarySearch(''),
    useSecondarySearch(''),
  ]);
  await waitFor(() => expect(result.current).toEqual([false, false]));
  expect(ajax).not.toHaveBeenCalled();
});

test('forbidden primary and secondary searches are suppressed', async () => {
  jest.spyOn(ajaxModule, 'ajax').mockImplementation(
    async (url) =>
      ({
        data:
          url === '/context/available_related_searches.json'
            ? ['ColObjCollectors']
            : undefined,
        status:
          url === '/context/available_related_searches.json'
            ? Http.OK
            : Http.FORBIDDEN,
      }) as never
  );
  const { result } = renderHook(() => ({
    primary: usePrimarySearch('Darwin'),
    secondary: useSecondarySearch('Darwin'),
  }));
  await waitFor(() =>
    expect(result.current).toEqual({ primary: false, secondary: [] })
  );
});
