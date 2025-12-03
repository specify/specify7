import { act, renderHook } from '@testing-library/react';
import React from 'react';

import { SearchDialogContext } from '../../components/Core/Contexts';
import { tables } from '../../components/DataModel/tables';
import { requireContext } from '../../tests/helpers';
import { mount } from '../../tests/reactUtils';
import type { Parser } from '../../utils/parser/definitions';
import { useParser } from '../resource';

requireContext();

describe('useParser', () => {
  function TestInSearchDialog({
    field,
    resource,
    defaultParser,
    callback,
  }: {
    // Done this way so that, in future, tests don't need to be modified that much.
    readonly field: Parameters<typeof useParser>[0];
    readonly resource?: Parameters<typeof useParser>[1];
    readonly defaultParser?: Parameters<typeof useParser>[2];
    readonly callback: (parser: Parser) => void;
  }) {
    const parser = useParser(field, resource, defaultParser);

    React.useEffect(() => {
      callback(parser);
    }, [parser]);

    return <></>;
  }

  test('simple formatter gets set', async () => {
    const collectionObject = new tables.CollectionObject.Resource({ id: 1 });
    const numberField = tables.CollectionObject.strictGetField('number1');

    let defaultParser: Parser | undefined = undefined;

    const { result, rerender } = renderHook(() =>
      useParser(numberField, collectionObject, defaultParser)
    );

    expect(result.current.type).toBe('number');

    defaultParser = {
      type: 'number',
      step: 3,
      required: false,
    };

    await act(rerender);

    expect(result.current.type).toBe('number');
    expect(result.current.step).toBe(3);
    expect(result.current.required).toBe(false);
  });

  test('formatter in simple search is always text', () => {
    const numberField = tables.CollectionObject.strictGetField('number1');

    const onParserSet = jest.fn();

    mount(
      <SearchDialogContext.Provider value>
        <TestInSearchDialog callback={onParserSet} field={numberField} />
      </SearchDialogContext.Provider>
    );

    expect(onParserSet).toHaveBeenCalled();
    expect(onParserSet.mock.calls.at(-1).at(0)).toEqual({ type: 'text' });
  });

  test('field is relationship', () => {
    const collectionObject = new tables.CollectionObject.Resource({ id: 1 });
    const collectingEvent =
      tables.CollectionObject.strictGetField('collectingevent');

    const { result } = renderHook(() =>
      useParser(collectingEvent, collectionObject)
    );

    expect(result.current).toEqual({ type: 'text', required: false });
  });

  test('field is undefined', () => {
    const collectionObject = new tables.CollectionObject.Resource({ id: 1 });

    const { result } = renderHook(() => useParser(undefined, collectionObject));

    expect(result.current).toEqual({ type: 'text' });
  });
});
