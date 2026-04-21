import { ajax } from '../../utils/ajax';
import { getAppResourceUrl } from '../../utils/ajax/helpers';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { cacheableUrl } from '../InitialContext';
import { xmlToSpec } from '../Syncer/xmlUtils';
import { interactionEntries } from './spec';

const url = cacheableUrl(getAppResourceUrl('InteractionsTaskInit'));
export const fetchLegacyInteractions = f.store(async () =>
  ajax<Element>(url, {
    headers: { Accept: 'text/xml' },
  }).then(({ data }) =>
    filterArray<SpecifyTable>(
      xmlToSpec(data, interactionEntries()).entry.map(
        ({ isFavorite, action, table }) =>
          isFavorite
            ? action === 'RET_LOAN'
              ? tables.LoanReturnPreparation
              : table
            : undefined
      )
    )
  )
);

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
