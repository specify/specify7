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

  test('updates config display order when a related query is moved above a table', async () => {
    const config = {
      tables: [
        {
          tableName: 'CollectionObject',
          displayOrder: 0,
          searchFields: [{ fieldName: 'CatalogNumber', inUse: true }],
          displayFields: [],
        },
      ],
      relatedQueries: [
        { id: '8', isActive: true, displayOrder: 1 },
      ],
    };

    const onChangeConfig = jest.fn();
    const relatedQueriesDefinitions = [
      { id: '8', name: 'CollObjToDeterminer' },
    ];

    const { container, user } = mount(
      <ResultsOrderingTab
        config={config}
        relatedQueriesDefinitions={relatedQueriesDefinitions}
        onChangeConfig={onChangeConfig}
      />
    );

    const rows = Array.from(container.querySelectorAll('ul > li'));
    expect(rows).toHaveLength(2);

    const secondRowButtons = rows[1].querySelectorAll('button');
    expect(secondRowButtons).toHaveLength(2);

    await user.click(secondRowButtons[0]);

    expect(onChangeConfig).toHaveBeenCalledTimes(1);
    const updatedConfig = onChangeConfig.mock.calls[0][0];
    expect(updatedConfig.relatedQueries[0].displayOrder).toBe(0);
    expect(updatedConfig.tables[0].displayOrder).toBe(1);
  });
});
