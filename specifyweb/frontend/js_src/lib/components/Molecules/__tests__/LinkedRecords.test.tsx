import { render, screen } from '@testing-library/react';
import React from 'react';

import { mergingText } from '../../../localization/merging';
import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import { useDirectDeleteBlockersForResource } from '../../DeleteBlockers/useDeleteBlockersForResource';
import { LinkedRecordsWrapped } from '../LinkedRecords';

jest.mock('../../DeleteBlockers/useDeleteBlockersForResource', () => ({
  useDirectDeleteBlockersForResource: jest.fn(),
}));

jest.mock('../../DeleteBlockers', () => ({
  DeleteBlockers: () => null,
  MIN_DELETEBLOCKER_CONTAINER_WIDTH: 0,
}));

requireContext();

const makeBlockers = (count: number) =>
  ({
    key: 'Agent:1',
    resource: new tables.Agent.Resource({ id: 1 }),
    count,
    tables: [],
  }) as never;

const mockBlockers = (count: number) =>
  jest.mocked(useDirectDeleteBlockersForResource).mockReturnValue({
    blockers: makeBlockers(count),
    onBlockersRequested: jest.fn(),
  });

const renderLinkedRecords = () =>
  render(
    <LinkedRecordsWrapped resource={new tables.Agent.Resource({ id: 1 })} />
  );

// [LinkedRecords] Show linked record count
test('shows the linked record count', () => {
  mockBlockers(2);

  renderLinkedRecords();

  expect(
    screen.getByRole('button', { name: mergingText.linkedRecords() })
  ).toHaveTextContent('2');
});
