import React from 'react';

import { mount } from '../../../tests/reactUtils';
import { RelatedTablesTab } from '../RelatedTablesTab';

describe('RelatedTablesTab', () => {
  test('calls onChangeConfig when a related query is enabled or disabled', async () => {
    const config = {
      tables: [],
      relatedQueries: [
        { id: '1', isActive: true, isSystem: true, displayOrder: 0 },
        { id: '2', isActive: false, isSystem: true, displayOrder: 1 },
      ],
    };

    const relatedQueriesDefinitions = [
      { id: '1', name: 'CollObjToDeterminer', description: 'Determiner' },
      { id: '2', name: 'CollObjToLocality', description: 'Locality' },
    ];

    const onChangeConfig = jest.fn();
    const { container, user } = mount(
      <RelatedTablesTab
        config={config}
        relatedQueriesDefinitions={relatedQueriesDefinitions}
        onChangeConfig={onChangeConfig}
      />
    );

    const rows = Array.from(container.querySelectorAll('li'));
    expect(rows).toHaveLength(2);

    const inactiveRow = rows.find((row) =>
      row.textContent?.includes('Locality')
    );
    expect(inactiveRow).toBeDefined();

    const checkbox = inactiveRow?.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeInstanceOf(HTMLInputElement);
    expect((checkbox as HTMLInputElement).checked).toBe(false);

    await user.click(checkbox as HTMLInputElement);

    expect(onChangeConfig).toHaveBeenCalledTimes(1);
    const newConfig = onChangeConfig.mock.calls[0][0];
    expect(newConfig.relatedQueries.find((rq: any) => rq.id === '2').isActive).toBe(true);

    const activeRow = rows[0];
    const activeCheckbox = activeRow.querySelector('input[type="checkbox"]');
    expect(activeCheckbox).toBeInstanceOf(HTMLInputElement);
    expect((activeCheckbox as HTMLInputElement).checked).toBe(true);

    await user.click(activeCheckbox as HTMLInputElement);

    expect(onChangeConfig).toHaveBeenCalledTimes(2);
    const secondConfig = onChangeConfig.mock.calls[1][0];
    expect(secondConfig.relatedQueries.find((rq: any) => rq.id === '1').isActive).toBe(false);
  });
});
