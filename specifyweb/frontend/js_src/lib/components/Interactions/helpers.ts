import { ajax } from '../../utils/ajax';
import { formData } from '../../utils/ajax/helpers';
import type { RA, RestrictedTuple } from '../../utils/types';
import type { AnyInteractionPreparation } from '../DataModel/helperTypes';
import type {
  CollectionObject,
  CollectionObjectGroup,
  Tables,
} from '../DataModel/types';

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
  readonly taxon: string | undefined;
  readonly taxonId: number | undefined;
  readonly preparationId: number;
  readonly prepType: string;
  readonly countAmount: number;
  readonly loaned: number;
  readonly gifted: number;
  readonly exchanged: number;
  readonly available: number;
  readonly cogId: number | undefined;
  readonly cogName: string | undefined;
  readonly isConsolidated: boolean;
};

export type PreparationRow = readonly [
  catalogNumber: string, // 0
  collectionObjectId: number, // 1
  taxonFullName: string | null, // 2
  taxonId: number | null, // 3
  preparationId: number, // 4
  prepType: string, // 5
  preparationCountAmt: number, // 6
  amountLoaned: string | null, // 7
  amountedGifted: string | null, // 8
  amountExchanged: string | null, // 9
  amountAvailable: string, // 10
  cogId: number | null, // 11
  cogName: string | null, // 12
  isConsolidated: 0 | 1, // 13
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

export const getPrepsForCoOrCog = async (
  model: CollectionObject['tableName'] | CollectionObjectGroup['tableName'],
  fieldName: string,
  records: RA<string>,
  isLoan: boolean
) =>
  ajax<RA<PreparationRow>>(`/interactions/associated_preps/${model}/`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: {
      fieldName,
      records,
      isLoan,
    },
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
