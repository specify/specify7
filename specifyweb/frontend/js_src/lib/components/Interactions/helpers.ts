import { ajax } from '../../utils/ajax';
import { formData } from '../../utils/ajax/helpers';
import type { RA, RestrictedTuple } from '../../utils/types';
import type { AnyInteractionPreparation } from '../DataModel/helperTypes';
import type { CollectionObject, Tables } from '../DataModel/types';
import type { CatalogNumberNumeric } from '../FieldFormatters';

export const interactionPrepTables: RestrictedTuple<
  AnyInteractionPreparation['tableName']
> = [
  'DisposalPreparation',
  'ExchangeInPrep',
  'ExchangeOutPrep',
  'GiftPreparation',
  'LoanPreparation',
];

type ExtractInteraction<T extends string> =
  T extends `${infer Prefix}Prep${string}` ? Prefix : never;

export type InteractionWithPreps = Tables[ExtractInteraction<
  AnyInteractionPreparation['tableName']
>];

export const interactionsWithPrepTables: RestrictedTuple<
  InteractionWithPreps['tableName']
> = ['Disposal', 'ExchangeIn', 'ExchangeOut', 'Gift', 'Loan'];

export type PreparationData = {
  readonly catalogNumber: string;
  readonly collectionObjectId: number;
  readonly taxon: string;
  readonly taxonId: number;
  readonly preparationId: number;
  readonly prepType: string;
  readonly countAmount: number;
  readonly loaned: number;
  readonly gifted: number;
  readonly exchanged: number;
  readonly available: number;
};

export type PreparationRow = readonly [
  catalogNumber: string,
  collectionObjectId: number,
  taxonFullName: string,
  taxonId: number,
  preparationId: number,
  prepType: string,
  preparationCountAmt: number,
  amountLoaned: string | null,
  amountedGifted: string | null,
  amountExchanged: string | null,
  amountAvailable: string
];

export const getPrepsAvailableForLoanRs = async (
  recordSetId: number,
  isLoan: boolean
) =>
  ajax<RA<PreparationRow>>(
    `/interactions/preparations_available_rs/${recordSetId}/`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData({ isLoan }),
    }
  ).then(({ data }) => data);

export const getPrepsAvailableForLoanCoIds = async (
  idField: string,
  collectionObjectIds: RA<string>,
  isLoan: boolean
) =>
  ajax<RA<PreparationRow>>('/interactions/preparations_available_ids/', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData({
      id_fld: idField,
      co_ids: collectionObjectIds,
      isLoan,
    }),
  }).then(({ data }) => data);

export const getCatNumberAvailableForAccession = async (
  idField: string,
  collectionObjectCatNumber: RA<string>
) =>
  // Returns available CO ids
  ajax<RA<number>>('/interactions/catNumber_available/', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData({
      id_fld: idField,
      co_catNum: collectionObjectCatNumber,
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
