import type { SpQueryField, Tables } from '../DataModel/types';
import type { RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import { StatsResult } from './StatsResult';
import React from 'react';
import {
  queryCountPromiseGenerator,
  useCustomStatsSpec,
  useResolvedSpec,
  useResolvedSpecToQueryResource,
  useStatValueLoad,
} from './hooks';
import type { CustomStat, DefaultStat, StatsSpec } from './types';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { SpQuery } from '../DataModel/types';
import { throttledAjax } from '../../utils/ajax/throttledAjax';
import { BackendStatsResult } from './types';
import { ajax } from '../../utils/ajax';

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
  const customStatsSpec = useCustomStatsSpec(item);
  const pathToValue =
    item.type === 'DefaultStat' && item.itemType === 'BackendStat'
      ? item.pathToValue
      : undefined;
  const statsSpecCalculated = useResolvedSpec(
    item.type === 'DefaultStat'
      ? statsSpec[item.pageName][item.categoryName]?.items?.[item.itemName]
      : customStatsSpec,
    pathToValue
  );

  const query = useResolvedSpecToQueryResource(
    statsSpecCalculated,
    item.itemLabel
  );

  return statsSpecCalculated?.type === 'QueryStat' && query !== undefined ? (
    <QueryItem
      isDefault={item.type === 'DefaultStat'}
      query={query}
      statLabel={item.itemLabel}
      statValue={item.itemValue}
      onClick={handleClick}
      onItemRename={handleItemRename}
      onRemove={handleRemove}
      onSpecChanged={
        handleSpecChanged !== undefined
          ? (tableName, fields) => {
              handleSpecChanged(tableName, fields, item.itemLabel);
            }
          : undefined
      }
      fields={statsSpecCalculated.fields}
      tableName={statsSpecCalculated.tableName}
      onItemValueLoad={handleItemValueLoad}
    />
  ) : item.type === 'DefaultStat' &&
    statsSpecCalculated !== undefined &&
    statsSpecCalculated.type === 'BackEndStat' &&
    statsSpecCalculated.pathToValue !== undefined ? (
    <BackEndItem
      isDefault
      urlToFetch={statsSpecCalculated.urlToFetch}
      pathToValue={statsSpecCalculated.pathToValue}
      statLabel={item.itemLabel}
      statValue={item.itemValue}
      onClick={handleClick}
      onItemRename={handleItemRename}
      onRemove={handleRemove}
      formatter={statsSpecCalculated.formatter}
      onItemValueLoad={handleItemValueLoad}
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
  readonly pathToValue: string;
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
      ).then((data) => {
        return formatter(data[pathToValue as keyof BackendStatsResult]);
      }),
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
  tableName,
  fields,
  statLabel,
  query,
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
  readonly query: SpecifyResource<SpQuery>;
  readonly statLabel: string;
  readonly isDefault: boolean;
  readonly onClick: (() => void) | undefined;
  readonly onRemove: (() => void) | undefined;
  readonly onSpecChanged:
    | ((
        tableName: keyof Tables,
        fields: RA<
          Partial<SerializedResource<SpQueryField>> & { readonly path: string }
        >
      ) => void)
    | undefined;
  readonly onItemRename: ((newLabel: string) => void) | undefined;
  readonly onItemValueLoad: ((value: number | string) => void) | undefined;
}): JSX.Element | null {
  const promiseGenerator = React.useCallback(
    () =>
      throttledAjax<
        number | string | undefined,
        {
          readonly tableName: keyof Tables;
          readonly fields: RA<
            Partial<SerializedResource<SpQueryField>> & {
              readonly path: string;
            }
          >;
        }
      >('queryStats', queryCountPromiseGenerator(query), {
        tableName,
        fields,
      }),
    [tableName, fields]
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
