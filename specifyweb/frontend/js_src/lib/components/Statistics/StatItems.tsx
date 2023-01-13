import React from 'react';

import { ajax } from '../../utils/ajax';
import { throttledAjax } from '../../utils/ajax/throttledAjax';
import type { RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import {
  queryCountPromiseGenerator,
  useCustomStatsSpec,
  useResolvedSpec,
  useResolvedSpecToQueryResource,
} from './hooks';
import { StatsResult } from './StatsResult';
import type {
  BackendStatsResult,
  CustomStat,
  DefaultStat,
  StatsSpec,
} from './types';

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
        value: number | string,
        itemLabel: string
      ) => void)
    | undefined;
  readonly onItemRename: ((newLabel: string) => void) | undefined;
}): JSX.Element | null {
  const customStatsSpec = useCustomStatsSpec(item);
  const pathToValue =
    item.type === 'DefaultStat' && item.itemType === 'BackendStat'
      ? item.pathToValue
      : undefined;
  const statsSpecCalculated = useResolvedSpec(
    item.type === 'DefaultStat'
      ? statsSpec[item.pageName][item.categoryName]?.items?.[item.itemName]
      : customStatsSpec,
    item.itemLabel,
    pathToValue
  );

  const query = useResolvedSpecToQueryResource(statsSpecCalculated);
  // TODO: this is just temporary. Needs refactoring
  const label =
    (statsSpecCalculated?.type === 'QueryStat'
      ? statsSpecCalculated?.label
      : undefined) ?? item.itemLabel;
  const handleItemValueLoad = React.useCallback(
    (value: number | string) =>
      handleValueLoad?.(categoryIndex, itemIndex, value, label),
    [handleValueLoad, categoryIndex, itemIndex, label]
  );

  return statsSpecCalculated?.type === 'QueryStat' && query !== undefined ? (
    <QueryItem
      fields={statsSpecCalculated.fields}
      isDefault={item.type === 'DefaultStat'}
      query={query}
      statLabel={statsSpecCalculated?.label}
      statValue={item.itemValue}
      tableName={statsSpecCalculated.tableName}
      onClick={handleClick}
      onItemRename={handleItemRename}
      onItemValueLoad={handleItemValueLoad}
      onRemove={handleRemove}
      onSpecChanged={
        handleSpecChanged !== undefined
          ? (tableName, fields) => {
              handleSpecChanged(tableName, fields, statsSpecCalculated?.label);
            }
          : undefined
      }
    />
  ) : item.type === 'DefaultStat' &&
    statsSpecCalculated !== undefined &&
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
  readonly statValue: number | string | undefined;
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
  const shouldFetch =
    statValue === undefined && typeof handleItemValueLoad === 'function';
  React.useEffect(() => {
    if (!shouldFetch) return undefined;
    let destructorCalled = false;
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
      const rawValue = data[pathToValue as keyof BackendStatsResult];
      if (rawValue === undefined || destructorCalled) return;
      handleItemValueLoad?.(formatter(rawValue));
    });
    return (): void => {
      destructorCalled = true;
    };
  }, [statValue, handleItemValueLoad, pathToValue, urlToFetch]);
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
  readonly statValue: number | string | undefined;
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
  const shouldFetch =
    statValue === undefined && typeof handleItemValueLoad === 'function';
  React.useCallback(() => {
    if (!shouldFetch) return undefined;
    let destructorCalled = false;
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
    }).then((value) => {
      if (value === undefined || destructorCalled) return;
      handleItemValueLoad?.(value);
    });
    return (): void => {
      destructorCalled = true;
    };
  }, [statValue, tableName, fields, handleItemValueLoad]);
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
