import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { queryText } from '../../../localization/query';
import { requireContext } from '../../../tests/helpers';
import * as ajaxModule from '../../../utils/ajax';
import { Http } from '../../../utils/ajax/definitions';
import { serializeResource } from '../../DataModel/serializers';
import { makeDataViewQuery } from '../../DataViews/queries';
import { QueryInputField as MockQueryInputField } from '../FieldFilterSpec';
import type { QueryFields } from '../Fields';
import { QueryFieldSpec } from '../fieldSpec';
import type { QueryBuilderResults } from '../QueryBuilderResults';
import { useQueryResultsWrapper as mockUseQueryResultsWrapper } from '../ResultsWrapper';
import { QueryBuilder } from '../Wrapped';

requireContext();

jest.mock('../../../hooks/navigation', () => ({
  useUnloadProtect: () => jest.fn(),
}));
jest.mock('../../Molecules/AppTitle', () => ({ useTitle: () => undefined }));
jest.mock('../../Header/MenuContext', () => ({
  useMenuItem: () => undefined,
}));
jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasPermission: () => true,
}));
jest.mock('../../WbPlanView/MapperComponents', () => ({
  MappingView: () => null,
}));
jest.mock('../Header', () => ({ QueryHeader: () => null }));
jest.mock('../CheckReadAccess', () => ({ CheckReadAccess: () => null }));
jest.mock('../Fields', () => ({
  QueryFields: ({ fields, onChangeField }: Parameters<typeof QueryFields>[0]) =>
    fields.map((field, index) => (
      <MockQueryInputField
        currentValue={field.filters[0].startValue}
        fieldName="lastName"
        key={field.id}
        parser={{ type: 'text' }}
        pickListItems={undefined}
        onChange={(startValue): void =>
          onChangeField?.(index, {
            ...field,
            filters: [{ ...field.filters[0], startValue }],
          })
        }
      />
    )),
}));
jest.mock('../QueryBuilderResults', () => ({
  QueryBuilderResults: ({
    state,
    table,
    queryResource,
    isCountOnly,
  }: Parameters<typeof QueryBuilderResults>[0]) => {
    mockUseQueryResultsWrapper({
      table,
      queryResource,
      fields: state.fields,
      queryRunCount: state.queryRunCount,
      countOnly: isCountOnly,
      recordSetId: undefined,
      forceCollection: undefined,
      selectedRows: [new Set<number>(), jest.fn()],
    });
    return null;
  },
}));

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test.each([
  ['embedded Enter', true, true],
  ['standalone Enter', false, true],
  ['embedded click', true, false],
] as const)(
  '%s runs with the latest filter value',
  async (_, isEmbedded, enter) => {
    const ajax = jest.spyOn(ajaxModule, 'ajax').mockResolvedValue({
      data: { count: 1, results: [[1, 'Smith']] },
      status: Http.OK,
      response: new Response('', { status: Http.OK }),
    });
    const field = QueryFieldSpec.fromPath('Agent', [
      'lastName',
    ]).toSpQueryField();
    field.set('operStart', 1);
    field.set('startValue', 'Jones');
    const query = makeDataViewQuery('Agent', {
      fields: [serializeResource(field)],
      selectDistinct: false,
      searchSynonymy: false,
      smushed: false,
    });
    const handleParentSubmit = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <div onSubmit={handleParentSubmit}>
        <QueryBuilder
          forceCollection={undefined}
          isEmbedded={isEmbedded}
          query={query}
        />
      </div>
    );
    const input = await screen.findByRole('textbox');
    jest.useFakeTimers();
    await act(async () => {
      await user.clear(input);
      await user.type(input, 'Smith');
    });
    expect(input).toHaveFocus();
    expect(ajax).not.toHaveBeenCalled();

    await act(async () => {
      if (enter) await user.keyboard('{Enter}');
      else
        await user.click(
          screen.getByRole('button', { name: queryText.query() })
        );
    });
    await act(async () => jest.runOnlyPendingTimersAsync());

    await waitFor(() => expect(ajax).toHaveBeenCalledTimes(2));
    for (const [url, options] of ajax.mock.calls) {
      expect(url).toBe('/stored_query/ephemeral/');
      expect(options?.body).toEqual(
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({ startvalue: 'Smith', operstart: 1 }),
          ]),
        })
      );
    }
    expect(handleParentSubmit).not.toHaveBeenCalled();
    if (enter) expect(input).toHaveFocus();
  }
);
