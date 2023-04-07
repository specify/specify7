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

export type StatLayout = {
  readonly label: string;
  readonly categories: RA<{
    readonly label: string;
    readonly items: RA<CustomStat | DefaultStat>;
  }>;
  readonly lastUpdated: string | undefined;
};

export type QuerySpec = {
  readonly tableName: keyof Tables;
  readonly fields: RA<
    Partial<SerializedResource<SpQueryField>> & { readonly path: string }
  >;
  readonly isDistinct?: boolean | null;
};

export type StatCategoryReturn = IR<{
  readonly label: string;
  readonly spec: StatItemSpec;
}>;

export type StatsSpec = IR<{
  readonly sourceLabel: string;
  readonly urlPrefix: string;
  readonly categories: IR<{
    readonly label: string;
    readonly items: StatCategoryReturn;
  }>;
}>;

export type QueryBuilderStat = State<
  'QueryBuilderStat',
  {
    readonly querySpec: QuerySpec;
  }
>;
export type BackendStatsResult = IR<any>;

export type StatFormatterSpec = {
  readonly showTotal: boolean;
};

export type StatFormatterGenerator = (
  spec: StatFormatterSpec
) => (rawResult: any) => string | undefined;
export type BackEndStat = BackEndBase & {
  readonly formatterGenerator: StatFormatterGenerator;
};
export type BackEndBase = State<
  'BackEndStat',
  {
    readonly pathToValue: string | undefined;
    readonly tableName: keyof Tables;
  }
>;
export type BackEndStatResolve = BackEndBase & {
  readonly fetchUrl: string;
  // Add type assertions for rawResult
  readonly formatter: (rawResult: any) => string | undefined;
};
export type StatItemSpec = BackEndStat | QueryBuilderStat;
