import { requireContext } from '../../../tests/helpers';
import { defaultColumnOptions } from '../linesGetter';
import { getDefaultMappingState } from '../Mapper';
import { emptyMapping } from '../mappingHelpers';
import { reducer } from '../mappingReducer';

requireContext();

// [WorkBench] Select an AutoMapper suggestion in the Data Mapper
test('selects an AutoMapper suggestion', () => {
  const initialState = getDefaultMappingState({
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

  const openedState = reducer(initialState, {
    type: 'OpenSelectElementAction',
    line: 0,
    index: 0,
  });

  const suggestedState = reducer(openedState, {
    type: 'AutoMapperSuggestionsLoadedAction',
    autoMapperSuggestions: [
      {
        mappingLineData: [],
        mappingPath: ['catalogNumber'],
      },
    ],
  });

  const updatedState = reducer(suggestedState, {
    type: 'AutoMapperSuggestionSelectedAction',
    suggestion: '1',
  });

  expect(updatedState.lines[0].mappingPath).toEqual(['catalogNumber']);
  expect(updatedState.changesMade).toBe(true);
  expect(updatedState.openSelectElement).toBeUndefined();
  expect(updatedState.autoMapperSuggestions).toBeUndefined();
});
