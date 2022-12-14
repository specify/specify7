import type { State } from 'typesafe-reducer';
import type { IR, RA } from '../../utils/types';
import type { SpQueryField, Tables } from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helperTypes';

export type CustomStat = State<
  'CustomStat',
  {
    readonly itemLabel: string;
    readonly tableName: keyof Tables;
    readonly fields: RA<
      Partial<SerializedResource<SpQueryField>> & { readonly path: string }
    >;
    readonly cachedValue?: string | number | undefined;
  }
>;
export type DefaultStat = State<
  'DefaultStat',
  {
    readonly pageName: string;
    readonly categoryName: string;
    readonly itemName: string;
    readonly fields?:
      | RA<
          Partial<SerializedResource<SpQueryField>> & { readonly path: string }
        >
      | undefined;
    readonly cachedLabel?: string | undefined;
    readonly cachedValue?: string | number | undefined;
  }
>;

export type StatLayout = RA<{
  readonly label: string;
  readonly categories: RA<{
    readonly label: string;
    readonly items: RA<CustomStat | DefaultStat>;
  }>;
}>;

export type StatCategoryReturn =
  | IR<{ readonly label: string; readonly spec: StatItemSpec }>
  | undefined;
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
  { readonly value: number | string | undefined }
>;
export type StatItemSpec = BackEndStat | QueryBuilderStat;
