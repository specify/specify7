import type { SpQueryField, Tables } from '../DataModel/types';
import type { RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import { StatsResult } from './StatsResult';
import React from 'react';
import { useFrontEndStat, useFrontEndStatsQuery } from './hooks';
import type { StatsSpec } from './types';

export function DefaultStatItem({
  statsSpec,
  pageName,
  categoryName,
  itemName,
  statCachedValue,
  statCachedLabel,
  onRemove: handleRemove,
  onClick: handleClick,
  onSpecChanged: handleSpecChanged,
  onValueLoad: handleValueLoad,
}: {
  readonly statsSpec: StatsSpec;
  readonly pageName: string;
  readonly categoryName: keyof typeof statsSpec;
  readonly itemName: string;
  readonly statCachedValue: number | string | undefined;
  readonly statCachedLabel: string | undefined;
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
}): JSX.Element {
  const statSpecItemPage = statsSpec[pageName];
  const statSpecItem = statSpecItemPage[categoryName]?.items?.[itemName];
  return React.useMemo(
    () =>
      statSpecItem?.spec.type === 'QueryBuilderStat' ? (
        <QueryStat
          fields={statSpecItem?.spec?.fields}
          statLabel={statSpecItem?.label ?? statCachedLabel}
          tableName={statSpecItem?.spec?.tableName}
          statCachedValue={statCachedValue}
          onValueLoad={handleValueLoad}
          onClick={handleClick}
          onRemove={handleRemove}
          onSpecChanged={
            handleSpecChanged !== undefined
              ? (tableName, fields) => {
                  handleSpecChanged(tableName, fields, statSpecItem.label);
                }
              : undefined
          }
        />
      ) : (
        <StatsResult
          query={undefined}
          statLabel={statSpecItem?.label ?? statCachedLabel}
          statValue={statSpecItem?.spec?.value}
          statCachedValue={statCachedValue}
          onClick={handleClick}
          onRemove={handleRemove}
          onSpecChanged={undefined}
          onValueLoad={handleValueLoad}
        />
      ),
    [statsSpec]
  );
}

export function QueryStat({
  tableName,
  fields,
  statLabel,
  statCachedValue,
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
  readonly statCachedValue: number | string | undefined;
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
  readonly onValueLoad: (statValue: number | string, itemName: string) => void;
}): JSX.Element {
  const frontEndQuery = useFrontEndStatsQuery(tableName, fields);
  const frontEndStatValue = useFrontEndStat(frontEndQuery, statCachedValue);
  return (
    <StatsResult
      query={frontEndQuery}
      statLabel={statLabel}
      statValue={frontEndStatValue}
      statCachedValue={statCachedValue}
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
