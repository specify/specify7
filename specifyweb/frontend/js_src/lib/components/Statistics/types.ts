import type { State } from 'typesafe-reducer';

import type { IR, RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQueryField, Tables } from '../DataModel/types';

export type CustomStat = State<
  'CustomStat',
  {
    readonly label: string;
    readonly querySpec: QuerySpec;
    readonly itemValue?: number | string | undefined;
  }
>;

export type DefaultStat = State<
  'DefaultStat',
  {
    readonly itemType: 'BackEndStat' | 'QueryStat';
    readonly pageName: string;
    readonly categoryName: string;
    readonly itemName: string;
    readonly label: string;
    readonly itemValue: number | string | undefined;
    readonly isVisible?: boolean;
    readonly pathToValue?: string;
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

export type QuerySpec = {
  readonly tableName: keyof Tables;
  readonly fields: RA<
    Partial<SerializedResource<SpQueryField>> & { readonly path: string }
  >;
};

export type StatCategoryReturn = IR<{
  readonly label: string;
  readonly spec: StatItemSpec;
}>;

export type StatsSpec = IR<
  IR<{
    readonly label: string;
    readonly items: StatCategoryReturn;
  }>
>;
export type QueryBuilderStat = State<
  'QueryBuilderStat',
  {
    readonly querySpec: QuerySpec;
  }
>;
export type BackendStatsResult = IR<any>;

export type BackEndStat = State<
  'BackEndStat',
  {
    readonly pathToValue: string | undefined;
    readonly fetchUrl: string;
    readonly formatter: (rawResult: any) => string | undefined;
  }
>;
export type StatItemSpec = BackEndStat | QueryBuilderStat;
