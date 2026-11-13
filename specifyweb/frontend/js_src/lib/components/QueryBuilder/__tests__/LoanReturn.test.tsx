import React from 'react';
import { within } from '@testing-library/react';

import { interactionsText } from '../../../localization/interactions';
import { requireContext } from '../../../tests/helpers';
import { overrideAjax } from '../../../tests/ajax';
import { mount } from '../../../tests/reactUtils';
import { LoadingContext } from '../../Core/Contexts';
import { tables } from '../../DataModel/tables';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { QueryLoanReturn } from '../LoanReturn';

jest.mock('../../Forms/SpecifyForm', () => ({
  SpecifyForm: () => null,
}));

jest.mock('../../Interactions/LoanReturn', () => ({
  loanReturnPrepForm: () => ({}),
}));

jest.mock('../../WbPlanView/helpers', () => ({
  ...jest.requireActual('../../WbPlanView/helpers'),
  mappingPathIsComplete: () => true,
}));

requireContext();

overrideAjax(
  '/stored_query/return_loan_preps/',
  {
    1: {
      loanpreparations: [{ quantity: 2 }],
      loannumber: 'L1',
    },
  },
  { method: 'POST' }
);

const noop = (): void => undefined;

// [QueryBuilder] Return loan button
test('Return Loan button shows returned preparations', async () => {
  const queryResource = new tables.SpQuery.Resource(
    { id: 1, name: 'Test query' },
    { noBusinessRules: true }
  );
  const { findByRole, getByRole, user } = mount(
    <UnloadProtectsContext.Provider value={[]}>
      <LoadingContext.Provider value={noop}>
        <QueryLoanReturn
          fields={[{ mappingPath: [] } as never]}
          queryResource={queryResource}
          getQueryFieldRecords={undefined}
        />
      </LoadingContext.Provider>
    </UnloadProtectsContext.Provider>
  );

  await user.click(
    getByRole('button', {
      name: interactionsText.returnLoan({ tableLoan: tables.Loan.label }),
    })
  );

  const loanRow = (await findByRole('link', { name: /l1/i })).closest('tr');
  expect(loanRow).not.toBeNull();
  expect(within(loanRow!).getByRole('cell', { name: '2' })).toBeInTheDocument();
});
