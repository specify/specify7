import React from 'react';
import { render, screen } from '@testing-library/react';

import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import type { SerializedResource } from '../../DataModel/helperTypes';
import type { SpQuery } from '../../DataModel/types';
import { QueryHeader } from '../Header';
import type { MainState } from '../reducer';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: () => true,
  hasTablePermission: () => true,
  hasToolPermission: () => true,
}));

jest.mock('../LoanReturn', () => ({
  QueryLoanReturn: () => <div>Return Loan records</div>,
}));

jest.mock('../Components', () => ({
  SaveQueryButtons: () => null,
  ToggleMappingViewButton: () => null,
}));

jest.mock('../SplitView', () => ({
  SplitViewOrientationButton: () => null,
  SplitViewToggleButton: () => null,
}));

jest.mock('../Edit', () => ({
  QueryEditButton: () => null,
}));

jest.mock('../Context', () => ({
  useQueryViewPref: () => [false, jest.fn()],
}));

requireContext();

const query = {
  id: 1,
  name: 'Test query',
  fields: [],
} as unknown as SerializedResource<SpQuery>;

const state: MainState = {
  type: 'MainState',
  fields: [],
  mappingView: ['0'],
  openedElement: { line: 1, index: undefined },
  queryRunCount: 0,
  baseTableName: 'LoanPreparation',
};

const props = {
  recordSet: undefined,
  query,
  isScrolledTop: true,
  form: null,
  isEmbedded: false,
  getQueryFieldRecords: undefined,
  saveRequired: false,
  unsetUnloadProtect: jest.fn(),
  onTriedToSave: jest.fn(),
  onSaved: jest.fn(),
  isSplit: false,
  canUseHorizontalSplit: false,
  isHorizontal: false,
  onToggleSplit: jest.fn(),
  onToggleOrientation: jest.fn(),
};

// [QueryBuilder] Return loan button only for Loan Preparation
test('shows Return Loan only for Loan Preparation base table', () => {
  const queryResource = new tables.SpQuery.Resource(
    { id: 1, name: 'Test query' },
    { noBusinessRules: true }
  );
  const { rerender } = render(
    <QueryHeader {...props} queryResource={queryResource} state={state} />
  );
  expect(screen.getByText('Return Loan records')).toBeInTheDocument();

  rerender(
    <QueryHeader
      {...props}
      queryResource={queryResource}
      state={{ ...state, baseTableName: 'CollectionObject' }}
    />
  );
  expect(screen.queryByText('Return Loan records')).not.toBeInTheDocument();
});
