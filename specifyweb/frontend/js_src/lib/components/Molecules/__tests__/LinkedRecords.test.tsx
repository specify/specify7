import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { mergingText } from '../../../localization/merging';
import { formsText } from '../../../localization/forms';
import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import { DeleteBlockers } from '../../DeleteBlockers';
import { useDirectDeleteBlockersForResource } from '../../DeleteBlockers/useDeleteBlockersForResource';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { LinkedRecordsWrapped } from '../LinkedRecords';

jest.mock('../../DeleteBlockers/useDeleteBlockersForResource', () => ({
  useDirectDeleteBlockersForResource: jest.fn(),
}));

jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasPermission: () => false,
  hasTablePermission: () => false,
}));

jest.mock('../../DeleteBlockers', () => ({
  DeleteBlockers: jest.fn(() => null),
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
    <UnloadProtectsContext.Provider value={[]}>
      <LinkedRecordsWrapped resource={new tables.Agent.Resource({ id: 1 })} />
    </UnloadProtectsContext.Provider>
  );

// [LinkedRecords] Show linked record count
test('shows the linked record count', () => {
  mockBlockers(2);

  renderLinkedRecords();

  expect(
    screen.getByRole('button', { name: mergingText.linkedRecords() })
  ).toHaveTextContent('2');
});

// [LinkedRecords] Open linked records dialog
test('opens the linked records dialog', () => {
  const blockers = makeBlockers(2);
  jest.mocked(useDirectDeleteBlockersForResource).mockReturnValue({
    blockers,
    onBlockersRequested: jest.fn(),
  });
  renderLinkedRecords();

  fireEvent.click(
    screen.getByRole('button', { name: mergingText.linkedRecords() })
  );

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(DeleteBlockers).toHaveBeenCalledWith(
    expect.objectContaining({
      blockers: [expect.objectContaining({ count: 2 })],
    }),
    expect.anything()
  );
});

// [LinkedRecords] Disable without linked records
test('disables the button without linked records', () => {
  mockBlockers(0);

  renderLinkedRecords();

  const button = screen.getByRole('button', {
    name: mergingText.linkedRecords(),
  });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute('title', formsText.noLinkedRecords());
});

// [LinkedRecords] Keep the button without delete permission
test('keeps the button without delete permission', () => {
  mockBlockers(1);

  renderLinkedRecords();

  expect(
    screen.getByRole('button', { name: mergingText.linkedRecords() })
  ).toBeEnabled();
});

// [LinkedRecords] Request blockers when opened
test('requests blockers when opened', () => {
  const onBlockersRequested = jest.fn();
  jest.mocked(useDirectDeleteBlockersForResource).mockReturnValue({
    blockers: makeBlockers(1),
    onBlockersRequested,
  });
  renderLinkedRecords();

  fireEvent.click(
    screen.getByRole('button', { name: mergingText.linkedRecords() })
  );

  expect(onBlockersRequested).toHaveBeenCalledTimes(1);
});
