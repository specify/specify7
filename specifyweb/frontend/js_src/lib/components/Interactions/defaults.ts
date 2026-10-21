import type { RA } from '../../utils/types';
import type { Tables } from '../DataModel/types';

export const defaultInteractionTables: RA<keyof Tables> = [
  'Accession',
  'Disposal',
  'Permit',
  'Loan',
  'LoanReturnPreparation',
  'Gift',
  'ExchangeIn',
  'ExchangeOut',
  'Borrow',
  'InfoRequest',
  'RepositoryAgreement',
  'Appraisal',
];
