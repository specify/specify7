import type { SpQueryField, Tables } from '../DataModel/types';
import type { RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import { StatsResult } from './StatsResult';
import React from 'react';
import {
  queryCountPromiseGenerator,
  useQuerySpecToResource,
  useStatValueLoad,
} from './hooks';
import type { CustomStat, DefaultStat, QuerySpec, StatsSpec } from './types';
import { throttledAjax } from '../../utils/ajax/throttledAjax';
import { BackendStatsResult } from './types';
import { ajax } from '../../utils/ajax';
import { useResolveStatSpec } from './hooks';

export function StatItem({
  statsSpec,
  item,
  categoryIndex,
  itemIndex,
  onRemove: handleRemove,
  onClick: handleClick,
  onSpecChanged: handleSpecChanged,
  onValueLoad: handleValueLoad,
  onItemRename: handleItemRename,
}: {
  readonly statsSpec: StatsSpec;
  readonly item: CustomStat | DefaultStat;
  readonly categoryIndex: number;
  readonly itemIndex: number;
  readonly onRemove: (() => void) | undefined;
  readonly onClick: (() => void) | undefined;
  readonly onSpecChanged:
    | ((querySpec: QuerySpec, itemName: string) => void)
    | undefined;
  readonly onValueLoad:
    | ((
        categoryIndex: number,
        itemIndex: number,
        value: number | string
      ) => void)
    | undefined;
  readonly onItemRename: ((newLabel: string) => void) | undefined;
}): JSX.Element | null {
  const handleItemValueLoad = React.useCallback(
    (value: number | string) =>
      handleValueLoad?.(categoryIndex, itemIndex, value),
    [handleValueLoad, categoryIndex, itemIndex]
  );
  const statsSpecCalculated = useResolveStatSpec(item, statsSpec);

  return statsSpecCalculated.type === 'QueryStat' ? (
    <QueryItem
      isDefault={item.type === 'DefaultStat'}
      tableName={statsSpecCalculated.tableName}
      fields={statsSpecCalculated.fields}
      statLabel={item.itemLabel}
      statValue={item.itemValue}
      onClick={handleClick}
      onItemRename={handleItemRename}
      onItemValueLoad={handleItemValueLoad}
      onRemove={handleRemove}
      onSpecChanged={
        handleSpecChanged !== undefined
          ? (querySpec) => {
              handleSpecChanged(querySpec, item.itemLabel);
            }
          : undefined
      }
    />
  ) : item.type === 'DefaultStat' &&
    statsSpecCalculated.type === 'BackEndStat' &&
    statsSpecCalculated.pathToValue !== undefined ? (
    <BackEndItem
      formatter={statsSpecCalculated.formatter}
      isDefault
      pathToValue={statsSpecCalculated.pathToValue}
      statLabel={item.itemLabel}
      statValue={item.itemValue}
      urlToFetch={statsSpecCalculated.urlToFetch}
      onClick={handleClick}
      onItemRename={handleItemRename}
      onItemValueLoad={handleItemValueLoad}
      onRemove={handleRemove}
    />
  ) : null;
}

function BackEndItem({
  statValue,
  urlToFetch,
  pathToValue,
  formatter,
  statLabel,
  isDefault,
  onClick: handleClick,
  onRemove: handleRemove,
  onItemRename: handleItemRename,
  onItemValueLoad: handleItemValueLoad,
}: {
  readonly statValue: string | number | undefined;
  readonly urlToFetch: string;
  readonly pathToValue: keyof BackendStatsResult;
  readonly statLabel: string;
  readonly isDefault: boolean;
  readonly formatter: (rawValue: any) => string;
  readonly onClick: (() => void) | undefined;
  readonly onRemove: (() => void) | undefined;
  readonly onItemRename: ((newLabel: string) => void) | undefined;
  readonly onItemValueLoad: ((value: number | string) => void) | undefined;
}): JSX.Element {
  const promiseGenerator = React.useCallback(
    () =>
      throttledAjax<BackendStatsResult, string>(
        'backendStats',
        async () =>
          ajax<BackendStatsResult>(urlToFetch, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          }).then(({ data }) => data),
        urlToFetch
      ).then((data) =>
        formatter(data[pathToValue as keyof BackendStatsResult])
      ),
    [pathToValue, urlToFetch]
  );
  useStatValueLoad(statValue, promiseGenerator, handleItemValueLoad);
  return (
    <StatsResult
      isDefault={isDefault}
      query={undefined}
      statLabel={statLabel}
      statValue={statValue}
      onClick={handleClick}
      onItemRename={handleItemRename}
      onRemove={handleRemove}
      onSpecChanged={undefined}
    />
  );
}

function QueryItem({
  statValue,
  statLabel,
  tableName,
  fields,
  onClick: handleClick,
  onRemove: handleRemove,
  onSpecChanged: handleSpecChanged,
  onItemRename: handleItemRename,
  isDefault,
  onItemValueLoad: handleItemValueLoad,
}: {
  readonly statValue: string | number | undefined;
  readonly tableName: keyof Tables;
  readonly fields: RA<
    Partial<SerializedResource<SpQueryField>> & { readonly path: string }
  >;
  readonly statLabel: string;
  readonly isDefault: boolean;
  readonly onClick: (() => void) | undefined;
  readonly onRemove: (() => void) | undefined;
  readonly onSpecChanged: ((querySpec: QuerySpec) => void) | undefined;
  readonly onItemRename: ((newLabel: string) => void) | undefined;
  readonly onItemValueLoad: ((value: number | string) => void) | undefined;
}): JSX.Element | null {
  const query = useQuerySpecToResource(statLabel, tableName, fields);
  const promiseGenerator = React.useCallback(
    async () =>
      throttledAjax<number | string | undefined, string>(
        'queryStats',
        queryCountPromiseGenerator(query),
        JSON.stringify({ tableName, fields })
      ),
    [query]
  );

  useStatValueLoad(statValue, promiseGenerator, handleItemValueLoad);

  return (
    <StatsResult
      isDefault={isDefault}
      query={query}
      statLabel={statLabel}
      statValue={statValue}
      onClick={handleClick}
      onItemRename={handleItemRename}
      onRemove={handleRemove}
      onSpecChanged={handleSpecChanged}
    />
  );
}
