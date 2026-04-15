import React from 'react';

import { mount } from '../../../tests/reactUtils';
import { ResultsOrderingTab } from '../ResultsOrderingTab';

describe('ResultsOrderingTab', () => {
  test('hides related queries that do not have a usable title', () => {
    const config = {
      tables: [],
      relatedQueries: [
        { id: '8', isActive: true, displayOrder: 0 },
        { id: '5', isActive: true, displayOrder: 1 },
      ],
    };

    const relatedQueriesDefinitions = [
      { id: '5', name: 'CollObjToDeterminer' },
    ];

    const { queryByText, container } = mount(
      <ResultsOrderingTab
        config={config}
        relatedQueriesDefinitions={relatedQueriesDefinitions}
        onChangeConfig={jest.fn()}
      />
    );

    expect(queryByText('Related Query: 8')).not.toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(1);
  });
});
