import type { LocalizedString } from 'typesafe-i18n';
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

export type PartialQueryFieldWithPath = Partial<
  SerializedResource<SpQueryField>
> & {
  readonly path: string;
};

export type DefaultStat = State<
  'DefaultStat',
  {
    readonly itemType: 'BackEndStat' | 'DynamicStat' | 'QueryStat';
    readonly pageName: string;
    readonly categoryName: string;
    readonly itemName: string;
    readonly label: LocalizedString;
    readonly itemValue: number | string | undefined;
    readonly isVisible?: boolean;
    readonly pathToValue?: number | string;
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

export type QueryFieldWithPath = Partial<SerializedResource<SpQueryField>> & {
  readonly path: string;
};

export type QuerySpec = {
  readonly tableName: keyof Tables;
  readonly fields: RA<PartialQueryFieldWithPath>;
  readonly isDistinct?: boolean | null;
  readonly searchSynonymy?: boolean | null;
};

export type StatCategoryReturn = IR<{
  readonly label: LocalizedString;
  readonly spec: StatItemSpec;
}>;

export type StatsSpec = IR<{
  readonly sourceLabel: LocalizedString;
  readonly urlPrefix: string;
  readonly categories: IR<{
    readonly label: LocalizedString;
    readonly items: StatCategoryReturn;
  }>;
}>;

export type QueryBuilderStat = State<
  'QueryStat',
  {
    readonly querySpec: QuerySpec;
  }
>;
export type BackendStatsResult = IR<any>;

export type StatFormatterSpec = {
  readonly showPreparationsTotal: boolean;
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
    readonly pathToValue: number | string | undefined;
    readonly querySpec?: (dynamicResult: string) => QuerySpec;
  }
>;
export type BackEndStatResolve = Omit<BackEndBase, 'querySpec'> & {
  readonly fetchUrl: string;
  // Add type assertions for rawResult
  readonly formatter: (rawResult: any) => string | undefined;
  readonly querySpec?: QuerySpec;
};
export type StatItemSpec = BackEndStat | DynamicStat | QueryBuilderStat;

export type DynamicStat = State<
  'DynamicStat',
  {
    readonly dynamicQuerySpec: QuerySpec;
    readonly querySpec: (dynamicResult: string) => QuerySpec;
  }
>;

export type DynamicQuerySpec = {
  readonly key: string;
  readonly spec: QuerySpec;
};
