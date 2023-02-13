import { requireContext } from '../../../tests/helpers';
import { exportsForTests } from '../InteractionsDialog';

const { fetchEntries } = exportsForTests;

requireContext();

test('fetches and parses interactions dialog entries', async () =>
  expect(
    fetchEntries().then((entries) => JSON.parse(JSON.stringify(entries)))
  ).resolves.toEqual([
    {
      icon: 'Accession',
      isFavorite: true,
      name: 'accession',
      table: '[table Accession]',
      tooltip: '',
    },
    {
      icon: 'Disposal',
      isFavorite: true,
      name: 'disposal',
      table: '[table Disposal]',
      tooltip: '',
    },
    {
      icon: 'Permit',
      isFavorite: true,
      name: 'permit',
      table: '[table Permit]',
      tooltip: '',
    },
    {
      icon: 'Loan',
      isFavorite: true,
      name: 'loan',
      table: '[table Loan]',
      tooltip: 'InteractionsTask.NEW_LN',
    },
    {
      icon: 'Gift',
      isFavorite: true,
      name: 'gift',
      table: '[table Gift]',
      tooltip: 'InteractionsTask.NEW_GFT',
    },
    {
      icon: 'ExchangeIn',
      isFavorite: true,
      name: 'exchangein',
      table: '[table ExchangeIn]',
      tooltip: '',
    },
    {
      icon: 'ExchangeOut',
      isFavorite: true,
      name: 'exchangeout',
      table: '[table ExchangeOut]',
      tooltip: '',
    },
    {
      icon: 'Borrow',
      isFavorite: true,
      name: 'borrow',
      table: '[table Borrow]',
      tooltip: '',
    },
    {
      icon: 'InfoRequest',
      isFavorite: true,
      name: 'inforequest',
      table: '[table InfoRequest]',
      tooltip: 'InteractionsTask.CRE_IR',
    },
    {
      icon: 'RepositoryAgreement',
      isFavorite: true,
      name: 'repositoryagreement',
      table: '[table RepositoryAgreement]',
      tooltip: '',
    },
    {
      icon: 'Reports',
      isFavorite: true,
      label: 'PRINT_INVOICE',
      name: 'printloan',
      table: '[table Loan]',
      tooltip: 'InteractionsTask.PRT_INV',
    },
  ]));
