import { act, fireEvent, screen } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { queryText } from '../../../localization/query';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { IsQueryBasicContext } from '../Context';
import { QueryLine } from '../Line';

requireContext();

test('removing a basic query field does not trigger row focus or keyboard navigation', async () => {
  const handleRemove = jest.fn();
  const handleLineFocus = jest.fn();
  mount(
    <IsQueryBasicContext.Provider value>
      <QueryLine
        baseTableName="CollectionObject"
        basicViewLabels={{
          field: queryText.queryField(),
          filter: commonText.filter(),
          options: queryText.queryOptions(),
        }}
        field={{
          id: 0,
          mappingPath: ['catalogNumber'],
          sortType: undefined,
          isDisplay: true,
          filters: [
            { type: 'any', startValue: '', isNot: false, isStrict: false },
          ],
        }}
        fieldHash="test-field"
        fieldName="catalogNumber"
        getMappedFields={() => []}
        isFocused={false}
        isLast
        openedElement={undefined}
        showHiddenFields={false}
        usedFormats={new Set()}
        onChange={undefined}
        onClose={undefined}
        onLineFocus={handleLineFocus}
        onMappingChange={undefined}
        onMoveDown={undefined}
        onMoveUp={undefined}
        onOpen={undefined}
        onOpenMap={undefined}
        onRemove={handleRemove}
      />
    </IsQueryBasicContext.Provider>
  );
  await act(async () => undefined);
  const remove = screen.getByRole('button', { name: commonText.remove() });
  fireEvent.keyDown(remove, { key: 'ArrowDown' });
  fireEvent.click(remove);
  expect(handleRemove).toHaveBeenCalledTimes(1);
  expect(handleLineFocus).not.toHaveBeenCalled();
});
