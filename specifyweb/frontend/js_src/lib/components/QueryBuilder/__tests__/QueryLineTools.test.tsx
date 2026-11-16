import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { queryText } from '../../../localization/query';
import { requireContext } from '../../../tests/helpers';
import { IsQueryBasicContext } from '../Context';
import type { QueryField } from '../helpers';
import { QueryLineTools } from '../QueryLineTools';

requireContext();

const field: QueryField = {
  id: 1,
  mappingPath: ['catalogNumber'],
  sortType: undefined,
  isDisplay: true,
  filters: [],
};

const fieldMeta = {
  fieldType: undefined,
  parser: undefined,
  canOpenMap: false,
  tableName: 'CollectionObject',
} as const;

// [QueryBuilder] Move field with arrow buttons
test('move buttons move the field up and down', () => {
  const onMoveUp = jest.fn();
  const onMoveDown = jest.fn();
  render(
    <IsQueryBasicContext.Provider value={false}>
      <QueryLineTools
        field={field}
        fieldMeta={fieldMeta}
        isFieldComplete
        onChange={undefined}
        onMoveDown={onMoveDown}
        onMoveUp={onMoveUp}
        onOpenMap={undefined}
      />
    </IsQueryBasicContext.Provider>
  );

  fireEvent.click(screen.getByRole('button', { name: queryText.moveUp() }));
  expect(onMoveUp).toHaveBeenCalledTimes(1);
  expect(onMoveDown).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: queryText.moveDown() }));
  expect(onMoveDown).toHaveBeenCalledTimes(1);
});

// [QueryBuilder] Sort button changes field sort order
test('sort button cycles the field sort order', () => {
  const onChange = jest.fn();
  const { rerender } = render(
    <IsQueryBasicContext.Provider value={false}>
      <QueryLineTools
        field={field}
        fieldMeta={fieldMeta}
        isFieldComplete
        onChange={onChange}
        onMoveDown={undefined}
        onMoveUp={undefined}
        onOpenMap={undefined}
      />
    </IsQueryBasicContext.Provider>
  );

  fireEvent.click(screen.getByRole('button', { name: queryText.sort() }));
  expect(onChange.mock.calls[0][0]).toEqual({
    ...field,
    sortType: 'ascending',
  });

  rerender(
    <IsQueryBasicContext.Provider value={false}>
      <QueryLineTools
        field={{ ...field, sortType: 'ascending' }}
        fieldMeta={fieldMeta}
        isFieldComplete
        onChange={onChange}
        onMoveDown={undefined}
        onMoveUp={undefined}
        onOpenMap={undefined}
      />
    </IsQueryBasicContext.Provider>
  );

  fireEvent.click(
    screen.getByRole('button', { name: queryText.ascendingSort() })
  );
  expect(onChange.mock.calls[1][0]).toEqual({
    ...field,
    sortType: 'descending',
  });

  rerender(
    <IsQueryBasicContext.Provider value={false}>
      <QueryLineTools
        field={{ ...field, sortType: 'descending' }}
        fieldMeta={fieldMeta}
        isFieldComplete
        onChange={onChange}
        onMoveDown={undefined}
        onMoveUp={undefined}
        onOpenMap={undefined}
      />
    </IsQueryBasicContext.Provider>
  );

  fireEvent.click(
    screen.getByRole('button', { name: queryText.descendingSort() })
  );
  expect(onChange.mock.calls[2][0]).toEqual({
    ...field,
    sortType: undefined,
  });
});
