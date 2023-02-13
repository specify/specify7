import { ajax } from '../../utils/ajax';
import { formData } from '../../utils/ajax/helpers';
import type { RA } from '../../utils/types';

export type Preparations = RA<{
  readonly catalogNumber: string;
  readonly taxon: string;
  readonly preparationId: number;
  readonly prepType: string;
  readonly countAmount: number;
  readonly loaned: number;
  readonly gifted: number;
  readonly exchanged: number;
  readonly available: number;
}>;

export type PreparationRow = readonly [
  string,
  string,
  number,
  string,
  number,
  string | null,
  string | null,
  string | null,
  string
];
export const getPrepsAvailableForLoanRs = async (recordSetId: number) =>
  ajax<RA<PreparationRow>>(
    `/interactions/preparations_available_rs/${recordSetId}/`,
    {
      headers: { Accept: 'application/json' },
    }
  ).then(({ data }) => data);

export const getPrepsAvailableForLoanCoIds = async (
  idField: string,
  collectionObjectIds: RA<string>
) =>
  ajax<RA<PreparationRow>>('/interactions/preparations_available_ids/', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData({
      id_fld: idField,
      co_ids: collectionObjectIds,
    }),
  }).then(({ data }) => data);

export const getInteractionsForPrepId = async (prepId: number) =>
  ajax<RA<readonly [number, string | null, string | null, string | null]>>(
    '/interactions/prep_interactions/',
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData({ prepIds: prepId }),
    }
  ).then(({ data }) => data[0]);

export const getPrepAvailability = async (
  prepId: number,
  iPrepId: number | undefined,
  iPrepName: string
) =>
  ajax(
    `/interactions/prep_availability/${prepId}/${
      typeof iPrepId === 'number' ? `${iPrepId}/${iPrepName}/` : ''
    }`,
    { headers: { Accept: 'application/json' } }
  ).then(({ data }) => data);
