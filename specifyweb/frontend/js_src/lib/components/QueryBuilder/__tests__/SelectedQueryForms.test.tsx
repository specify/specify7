import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';

import { queryText } from '../../../localization/query';
import { requireContext } from '../../../tests/helpers';
import * as ajaxModule from '../../../utils/ajax';
import { Http } from '../../../utils/ajax/definitions';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import {
  defaultDataViewQuery,
  makeDataViewQuery,
} from '../../DataViews/queries';
import { RecordSelectorFromIds } from '../../FormSliders/RecordSelectorFromIds';
import { SelectedQueryForms } from '../SelectedQueryForms';
import { allSelection, emptySelection } from '../selection';

requireContext();

jest.mock('../../FormSliders/RecordSelectorFromIds', () => ({
  RecordSelectorFromIds: jest.fn(() => null),
}));

function sliderProps() {
  const calls = jest.mocked(RecordSelectorFromIds).mock.calls;
  const props = calls[calls.length - 1]?.[0];
  if (props === undefined) throw new Error('Form slider was not rendered');
  return props;
}

function executedQuery() {
  return serializeResource(
    makeDataViewQuery('Agent', defaultDataViewQuery('Agent'))
  );
}

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

test('reuses loaded rows for existing callers without running another query', () => {
  const ajax = jest.spyOn(ajaxModule, 'ajax');
  render(
    <SelectedQueryForms
      table={tables.Agent}
      results={[[1], [2]]}
      selectedRows={new Set()}
      totalCount={100}
      onFetchMore={jest.fn()}
      onDelete={jest.fn()}
    />
  );
  expect(RecordSelectorFromIds).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: queryText.browseInForms() })
  );
  expect(sliderProps().ids.slice(0, 2)).toEqual([1, 2]);
  expect(sliderProps().ids).toHaveLength(100);
  expect(Object.keys(sliderProps().ids)).toEqual(['0', '1']);
  expect(sliderProps().totalCount).toBe(100);
  expect(sliderProps().dialog).toBe('modal');
  expect(ajax).not.toHaveBeenCalled();
});

test('embedded explicit-ID selection uses only those IDs without fetching table pages', async () => {
  const ajax = jest.spyOn(ajaxModule, 'ajax');
  const onFetchMore = jest.fn();
  const onDelete = jest.fn();
  const onSlide = jest.fn();
  const onSaved = jest.fn();
  render(
    <SelectedQueryForms
      inline
      table={tables.Agent}
      results={[[1], [2], [3]]}
      selectedRows={new Set([3, 1])}
      totalCount={100}
      selectedIndex={1}
      onFetchMore={onFetchMore}
      onDelete={onDelete}
      onSlide={onSlide}
      onSaved={onSaved}
    />
  );
  expect(sliderProps().ids).toEqual([3, 1]);
  expect(sliderProps().totalCount).toBe(2);
  expect(sliderProps().defaultIndex).toBe(1);
  expect(sliderProps().dialog).toBe(false);
  await act(async () => {
    sliderProps().onSlide?.(0, false);
    await sliderProps().onFetch?.(0);
    sliderProps().onDelete?.(0, 'deleteButton');
    sliderProps().onSaved(new tables.Agent.Resource({ id: 3 }));
  });
  expect(onSlide).toHaveBeenCalledWith(0);
  expect(onDelete).toHaveBeenCalledWith(3);
  expect(onSaved).toHaveBeenCalledTimes(1);
  expect(onFetchMore).not.toHaveBeenCalled();
  expect(ajax).not.toHaveBeenCalled();
});

test('existing paginated callers fetch only missing rows through their own callback', async () => {
  const onFetchMore = jest.fn();
  render(
    <SelectedQueryForms
      inline
      table={tables.Agent}
      results={[[1], [2]]}
      selectedRows={new Set()}
      totalCount={100}
      onFetchMore={onFetchMore}
      onDelete={jest.fn()}
    />
  );
  await act(async () => {
    await sliderProps().onFetch?.(0);
    sliderProps().onSlide?.(0, false);
  });
  expect(onFetchMore).not.toHaveBeenCalled();
  await act(async () => {
    await sliderProps().onFetch?.(80);
  });
  expect(onFetchMore).toHaveBeenCalledWith(80);
});

test('explicit empty query selection disables browsing and never falls back to all results', () => {
  const ajax = jest.spyOn(ajaxModule, 'ajax');
  render(
    <SelectedQueryForms
      table={tables.Agent}
      selectedQuery={{ query: executedQuery(), selection: emptySelection() }}
      selectedCount={0}
      onDelete={jest.fn()}
    />
  );
  expect(
    screen.getByRole('button', { name: queryText.browseInForms() })
  ).toBeDisabled();
  expect(RecordSelectorFromIds).not.toHaveBeenCalled();
  expect(ajax).not.toHaveBeenCalled();
});

test('query selections fetch filtered pages only when browsing opens', async () => {
  const ajax = jest.spyOn(ajaxModule, 'ajax').mockResolvedValue({
    data: { results: Array.from({ length: 40 }, (_, index) => [index + 1]) },
    status: Http.OK,
    response: new Response('', { status: Http.OK }),
  });
  render(
    <SelectedQueryForms
      table={tables.Agent}
      selectedQuery={{ query: executedQuery(), selection: allSelection() }}
      selectedCount={1_000_000}
      onDelete={jest.fn()}
    />
  );
  expect(ajax).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole('button', { name: queryText.browseInForms() })
  );
  await waitFor(() => expect(RecordSelectorFromIds).toHaveBeenCalled());
  expect(sliderProps().ids).toHaveLength(1_000_000);
  expect(Object.keys(sliderProps().ids)).toHaveLength(40);
  expect(ajax.mock.calls[0][1]?.body).toEqual(
    expect.objectContaining({
      selection: { mode: 'exclude', ids: [] },
      limit: 40,
      offset: 0,
    })
  );
  await act(async () => {
    await sliderProps().onFetch?.(80);
  });
  expect(ajax.mock.calls[1][1]?.body).toEqual(
    expect.objectContaining({
      selection: { mode: 'exclude', ids: [] },
      limit: 40,
    })
  );
});

test('inline browsing does not render rows without valid record IDs', () => {
  render(
    <SelectedQueryForms
      inline
      table={tables.Agent}
      results={[['1,2']]}
      selectedRows={new Set()}
      totalCount={1}
      onFetchMore={undefined}
      onDelete={jest.fn()}
    />
  );
  expect(RecordSelectorFromIds).not.toHaveBeenCalled();
});
