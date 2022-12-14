import type { SpQueryField, Tables } from '../DataModel/types';
import type { RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import { StatsResult } from './StatsResult';
import React from 'react';
import { useFrontEndStat, useFrontEndStatsQuery } from './hooks';
import type { StatsSpec } from './types';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { SpQuery } from '../DataModel/types';

export function DefaultStatItem({
  statsSpec,
  pageName,
  categoryName,
  itemName,
  itemValue,
  onRemove: handleRemove,
  onClick: handleClick,
  onSpecChanged: handleSpecChanged,
  onValueLoad: handleValueLoad,
  onStatNetwork: handleStatNetwork,
}: {
  readonly statsSpec: StatsSpec;
  readonly pageName: string;
  readonly categoryName: keyof typeof statsSpec;
  readonly itemName: string;
  readonly itemValue: number | string | undefined;
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
    | ((statValue: number | string, itemName: string) => void)
    | undefined;
  readonly onStatNetwork: (
    query: SpecifyResource<SpQuery> | undefined
  ) => Promise<string | undefined>;
}): JSX.Element {
  const statSpecItemPage = statsSpec[pageName];
  const statSpecItem = statSpecItemPage[categoryName]?.items?.[itemName];
  return statSpecItem?.spec.type === 'QueryBuilderStat' ? (
    <QueryStat
      fields={statSpecItem?.spec?.fields}
      statLabel={statSpecItem?.label}
      tableName={statSpecItem?.spec?.tableName}
      statValue={itemValue}
      onValueLoad={
        typeof handleValueLoad === 'function'
          ? (statValue) => {
              handleValueLoad(statValue, itemName);
            }
          : undefined
      }
      onClick={handleClick}
      onRemove={handleRemove}
      onSpecChanged={
        handleSpecChanged !== undefined
          ? (tableName, fields) => {
              handleSpecChanged(tableName, fields, statSpecItem.label);
            }
          : undefined
      }
      onStatNetwork={handleStatNetwork}
    />
  ) : (
    <StatsResult
      query={undefined}
      statLabel={statSpecItem?.label}
      statValue={statSpecItem?.spec.value ?? itemValue}
      onClick={handleClick}
      onRemove={handleRemove}
      onSpecChanged={undefined}
      onValueLoad={
        typeof handleValueLoad === 'function'
          ? (statValue) => {
              handleValueLoad(statValue, itemName);
            }
          : undefined
      }
    />
  );
}

export function QueryStat({
  tableName,
  fields,
  statLabel,
  statValue,
  onRemove: handleRemove,
  onClick: handleClick,
  onSpecChanged: handleSpecChanged,
  onValueLoad: handleValueLoad,
  onStatNetwork: handleStatNetwork,
}: {
  readonly tableName: keyof Tables | undefined;
  readonly fields:
    | RA<Partial<SerializedResource<SpQueryField>> & { readonly path: string }>
    | undefined;
  readonly statLabel: string | undefined;
  readonly statValue: number | string | undefined;
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
  readonly onValueLoad: ((statValue: number | string) => void) | undefined;
  readonly onStatNetwork?: (
    query: SpecifyResource<SpQuery> | undefined
  ) => Promise<string | undefined>;
}): JSX.Element {
  const frontEndQuery = useFrontEndStatsQuery(tableName, fields);
  const frontEndStatValue = useFrontEndStat(
    statValue === undefined ? frontEndQuery : undefined,
    handleStatNetwork,
    statValue
  );
  return (
    <StatsResult
      query={frontEndQuery}
      statLabel={statLabel}
      statValue={frontEndStatValue ?? statValue}
      onClick={handleClick}
      onRemove={handleRemove}
      onSpecChanged={handleSpecChanged}
      onValueLoad={handleValueLoad}
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
