import { render, screen } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import { DeleteBlockers } from '../index';

jest.mock('../../../hooks/useScreenSize', () => ({
  useScreenSize: () => true,
}));

requireContext();

// [DeleteBlockers] Show linked record counts
test('shows linked record counts', () => {
  const resource = new tables.Agent.Resource({ id: 1 });
  const blocker = {
    key: 'Agent:1',
    resource,
    count: 2,
    tables: [
      {
        tableName: 'CollectingEvent',
        count: 2,
        relationships: [],
      },
    ],
  } as never;

  render(<DeleteBlockers blockers={[blocker]} resource={resource} />);

  expect(screen.getByText(/Collecting Event.*2/u)).toBeInTheDocument();
});
