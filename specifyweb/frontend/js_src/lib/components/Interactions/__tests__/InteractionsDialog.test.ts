import { requireContext } from '../../../tests/helpers';
import { exportsForTests } from '../InteractionsDialog';

const { fetchEntries } = exportsForTests;

requireContext();

test('fetches and parses interactions dialog entries', async () =>
  expect(
    fetchEntries().then((entries) => entries.map(({ name }) => name))
  ).resolves.toEqual([
    'Accession',
    'Disposal',
    'Permit',
    'Loan',
    'Gift',
    'ExchangeIn',
    'ExchangeOut',
    'Borrow',
    'InfoRequest',
    'RepositoryAgreement',
    'Loan',
  ]));
