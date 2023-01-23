import type { State } from 'typesafe-reducer';

import type { IR, RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQueryField, Tables } from '../DataModel/types';

export type CustomStat = State<
  'CustomStat',
  {
    readonly itemLabel: string;
    readonly tableName: keyof Tables;
    readonly fields: RA<
      Partial<SerializedResource<SpQueryField>> & { readonly path: string }
    >;
    readonly itemValue?: number | string | undefined;
  }
>;

export type DefaultStat = State<
  'DefaultStat',
  {
    readonly itemType: 'BackendStat' | 'QueryStat';
    readonly pageName: string;
    readonly categoryName: string;
    readonly itemName: string;
    readonly itemLabel: string;
    readonly itemValue: number | string | undefined;
    readonly isVisible?: boolean;
    readonly pathToValue?: keyof BackendStatsResult;
  }
>;

export type StatLayout = RA<{
  readonly label: string;
  readonly categories: RA<{
    readonly label: string;
    readonly items: RA<CustomStat | DefaultStat> | undefined;
    readonly categoryToFetch?: string;
  }>;
  readonly lastUpdated: string | undefined;
}>;

export type StatSpecCalculated =
  | BackEndStat
  | {
      readonly type: 'QueryStat';
      readonly tableName: keyof Tables;
      readonly fields: RA<
        Partial<SerializedResource<SpQueryField>> & { readonly path: string }
      >;
    };

export type StatCategoryReturn = IR<{
  readonly label: string;
  readonly spec: StatItemSpec;
}>;
export type ItemReturnSpec = {
  readonly label: string;
  readonly spec: StatItemSpec;
};
export type StatsSpec = IR<
  IR<{
    readonly label: string;
    readonly items: StatCategoryReturn;
  }>
>;
export type QueryBuilderStat = State<
  'QueryBuilderStat',
  {
    readonly tableName: keyof Tables;
    readonly fields: RA<
      Partial<SerializedResource<SpQueryField>> & { readonly path: string }
    >;
  }
>;
export type BackendStatsResult = {
  readonly holdings: {
    readonly familiesRepresented: number;
    readonly generaRepresented: number;
    readonly speciesRepresented: number;
  };
  readonly preparations: IR<{
    readonly lots: number;
    readonly total: number;
  }>;
  readonly localityGeography: { readonly countries: number };
  readonly typeSpecimens: IR<number>;
};
export type BackEndStat = State<
  'BackEndStat',
  {
    readonly pathToValue: keyof BackendStatsResult | undefined;
    readonly urlToFetch: string;
    readonly formatter: (rawResult: any) => string;
  }
>;
export type StatItemSpec = BackEndStat | QueryBuilderStat;
