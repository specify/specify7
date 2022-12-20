import type { SpQueryField, Tables } from '../DataModel/types';
import type { RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import { StatsResult } from './StatsResult';
import React from 'react';
import {
  useCustomStatsSpec,
  useFrontEndStat,
  useFrontEndStatsQuery,
  useResolvedSpec,
  useValueLoad,
} from './hooks';
import type { CustomStat, DefaultStat, StatsSpec } from './types';

export function StatItem({
  statsSpec,
  item,
  categoryIndex,
  itemIndex,
  onRemove: handleRemove,
  onClick: handleClick,
  onSpecChanged: handleSpecChanged,
  onValueLoad: handleValueLoad,
}: {
  readonly statsSpec: StatsSpec;
  readonly item: CustomStat | DefaultStat;
  readonly categoryIndex: number;
  readonly itemIndex: number;
  readonly onRemove: (() => void) | undefined;
  readonly onClick: (() => void) | undefined;
  readonly onSpecChanged:
    | ((
        tableName: keyof Tables,
        fields: RA<
          Partial<SerializedResource<SpQueryField>> & { readonly path: string }
        >,
        itemName: string
      ) => void)
    | undefined;
  readonly onValueLoad:
    | ((
        categoryIndex: number,
        itemIndex: number,
        value: number | string,
        itemLabel: string
      ) => void)
    | undefined;
}): JSX.Element | null {
  const customStatsSpec = useCustomStatsSpec(item);
  const statsSpecCalculated = useResolvedSpec(
    item.type === 'DefaultStat'
      ? statsSpec[item.pageName][item.categoryName]?.items?.[item.itemName]
      : customStatsSpec,
    item.itemLabel
  );
  useValueLoad(
    statsSpecCalculated,
    categoryIndex,
    itemIndex,
    handleValueLoad,
    item.itemValue
  );
  return statsSpecCalculated?.type === 'QueryStat' ? (
    <StatsResult
      query={statsSpecCalculated.query}
      statLabel={statsSpecCalculated?.label}
      statValue={item.itemValue}
      onClick={handleClick}
      onRemove={handleRemove}
      onSpecChanged={
        handleSpecChanged !== undefined
          ? (tableName, fields) => {
              handleSpecChanged(tableName, fields, statsSpecCalculated?.label);
            }
          : undefined
      }
    />
  ) : item.type === 'DefaultStat' ? (
    <StatsResult
      query={undefined}
      statLabel={item.itemLabel}
      statValue={item.itemValue}
      onClick={handleClick}
      onRemove={handleRemove}
      onSpecChanged={undefined}
    />
  ) : null;
}

export function QueryStat({
  tableName,
  fields,
  statLabel,
  statValue,
  itemIndex,
  categoryIndex,
  onRemove: handleRemove,
  onClick: handleClick,
  onSpecChanged: handleSpecChanged,
  onValueLoad: handleValueLoad,
}: {
  readonly tableName: keyof Tables | undefined;
  readonly fields:
    | RA<Partial<SerializedResource<SpQueryField>> & { readonly path: string }>
    | undefined;
  readonly statLabel: string | undefined;
  readonly statValue: number | string | undefined;
  readonly itemIndex: number;
  readonly categoryIndex: number;
  readonly onRemove: (() => void) | undefined;
  readonly onClick: (() => void) | undefined;
  readonly onSpecChanged:
    | ((
        tableName: keyof Tables,
        fields: RA<
          Partial<SerializedResource<SpQueryField>> & { readonly path: string }
        >
      ) => void)
    | undefined;
  readonly onValueLoad:
    | ((
        categoryIndex: number,
        itemIndex: number,
        value: number | string,
        itemLabel: string
      ) => void)
    | undefined;
}): JSX.Element {
  const frontEndQuery = useFrontEndStatsQuery(tableName, fields);
  return (
    <StatsResult
      query={frontEndQuery}
      statLabel={statLabel}
      statValue={statValue}
      onClick={handleClick}
      onRemove={handleRemove}
      onSpecChanged={handleSpecChanged}
    />
  );
}
/*
export function CustomStatItem({
  queryId,
  onRemove: handleRemove,
  onClick: handleClick,
}: {
  readonly queryId: number;
  readonly onRemove: (() => void) | undefined;
  readonly onClick: (() => void) | undefined;
}): JSX.Element {
  const { tableName, fields, label } = useCustomStatQuery(queryId) ?? {};
  return tableName === undefined ||
    fields === undefined ||
    label === undefined ? (
    <p>{commonText('loading')}</p>
  ) : (
    <QueryStat
      fields={fields}
      statLabel={label}
      tableName={tableName}
      statCachedValue={2}
      onClick={handleClick}
      onRemove={handleRemove}
      onSpecChanged={undefined}
      onValueLoad={}
    />
  );
} */
