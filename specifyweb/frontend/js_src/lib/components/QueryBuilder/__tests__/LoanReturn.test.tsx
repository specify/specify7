import React from 'react';

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
          fields={[{ mappingPath: ['loan', 'loanNumber'] } as never]}
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

  const link = await findByRole('link', { name: /l1/i });
  expect(link).toHaveAttribute('href', '/specify/view/loan/1/');
  const loanRow = link.closest('tr')!;
  expect(loanRow.cells[0]).toHaveTextContent('L1');
  expect(loanRow.cells[1]).toHaveTextContent('2');
});
