import { requireContext } from '../../../tests/helpers';
import { defaultColumnOptions } from '../linesGetter';
import { getDefaultMappingState } from '../Mapper';
import { emptyMapping } from '../mappingHelpers';
import { reducer } from '../mappingReducer';

requireContext();

// [WorkBench] Select a field mapping in the Data Mapper
test('selects a field mapping', () => {
  const state = getDefaultMappingState({
    changesMade: false,
    lines: [
      {
        headerName: 'Catalog Number',
        mappingPath: [emptyMapping],
        columnOptions: defaultColumnOptions,
      },
    ],
    mustMatchPreferences: {},
  });

  const updatedState = reducer(state, {
    type: 'ChangeSelectElementValueAction',
    line: 0,
    index: 0,
    newValue: 'catalogNumber',
    isRelationship: false,
    parentTableName: 'CollectionObject',
    newTableName: undefined,
    currentTableName: undefined,
  });

  expect(updatedState.lines[0].mappingPath).toEqual(['catalogNumber']);
  expect(updatedState.changesMade).toBe(true);
});
