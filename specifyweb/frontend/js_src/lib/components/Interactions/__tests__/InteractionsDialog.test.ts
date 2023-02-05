import { requireContext } from '../../../tests/helpers';
import { exportsForTests } from '../InteractionsDialog';

const { fetchEntries } = exportsForTests;

requireContext();

test('fetches and parses interactions dialog entries', async () =>
  expect(fetchEntries()).resolves.toEqual([
    {
      action: undefined,
      icon: 'Accession',
      label: undefined,
      table: 'Accession',
      tooltip: undefined,
    },
    {
      action: undefined,
      icon: 'Disposal',
      label: undefined,
      table: 'Disposal',
      tooltip: undefined,
    },
    {
      action: undefined,
      icon: 'Permit',
      label: undefined,
      table: 'Permit',
      tooltip: undefined,
    },
    {
      action: 'NEW_LOAN',
      icon: 'Loan',
      label: undefined,
      table: 'Loan',
      tooltip: 'InteractionsTask.NEW_LN',
    },
    {
      action: 'NEW_GIFT',
      icon: 'Gift',
      label: undefined,
      table: 'Gift',
      tooltip: 'InteractionsTask.NEW_GFT',
    },
    {
      action: undefined,
      icon: 'ExchangeIn',
      label: undefined,
      table: 'ExchangeIn',
      tooltip: undefined,
    },
    {
      action: undefined,
      icon: 'ExchangeOut',
      label: undefined,
      table: 'ExchangeOut',
      tooltip: undefined,
    },
    {
      action: undefined,
      icon: 'Borrow',
      label: undefined,
      table: 'Borrow',
      tooltip: undefined,
    },
    {
      action: undefined,
      icon: 'InfoRequest',
      label: undefined,
      table: 'InfoRequest',
      tooltip: 'InteractionsTask.CRE_IR',
    },
    {
      action: undefined,
      icon: 'RepositoryAgreement',
      label: undefined,
      table: 'RepositoryAgreement',
      tooltip: undefined,
    },
    {
      action: 'PRINT_INVOICE',
      icon: 'Reports',
      label: 'PRINT_INVOICE',
      table: 'Loan',
      tooltip: 'InteractionsTask.PRT_INV',
    },
  ]));
