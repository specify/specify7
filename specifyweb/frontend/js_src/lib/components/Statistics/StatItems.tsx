import React from 'react';

import { ajax } from '../../utils/ajax';
import { throttledPromise } from '../../utils/ajax/throttledPromise';
import {
  queryCountPromiseGenerator,
  querySpecToResource,
  useResolvedStatSpec,
  useStatValueLoad,
} from './hooks';
import { StatsResult } from './StatsResult';
import type {
  BackendStatsResult,
  CustomStat,
  DefaultStat,
  QuerySpec,
  StatsSpec,
} from './types';

export function StatItem({
  statsSpec,
  item,
  categoryIndex,
  itemIndex,
  onRemove: handleRemove,
  onClick: handleClick,
  onEdit: handleEdit,
  onLoad: onLoad,
  onRename: handleRename,
}: {
  readonly statsSpec: StatsSpec;
  readonly item: CustomStat | DefaultStat;
  readonly categoryIndex: number;
  readonly itemIndex: number;
  readonly onRemove: (() => void) | undefined;
  readonly onClick: (() => void) | undefined;
  readonly onEdit:
    | ((querySpec: QuerySpec, itemName: string) => void)
    | undefined;
  readonly onLoad:
    | ((
        categoryIndex: number,
        itemIndex: number,
        value: number | string
      ) => void)
    | undefined;
  readonly onRename: ((newLabel: string) => void) | undefined;
}): JSX.Element | null {
  const handleLoad = React.useCallback(
    (value: number | string) => onLoad?.(categoryIndex, itemIndex, value),
    [onLoad, categoryIndex, itemIndex]
  );
  const resolvedSpec = useResolvedStatSpec(item, statsSpec);

  return resolvedSpec.type === 'QueryBuilderStat' ? (
    <QueryItem
      isDefault={item.type === 'DefaultStat'}
      label={item.label}
      querySpec={resolvedSpec.querySpec}
      value={item.itemValue}
      onClick={handleClick}
      onEdit={
        handleEdit !== undefined
          ? (querySpec) => {
              handleEdit(querySpec, item.label);
              console.log('query spec is', querySpec);
            }
          : undefined
      }
      onLoad={handleLoad}
      onRemove={handleRemove}
      onRename={handleRename}
    />
  ) : item.type === 'DefaultStat' &&
    resolvedSpec.type === 'BackEndStat' &&
    resolvedSpec.pathToValue !== undefined ? (
    <BackEndItem
      fetchUrl={resolvedSpec.fetchUrl}
      formatter={resolvedSpec.formatter}
      isDefault
      label={item.label}
      pathToValue={resolvedSpec.pathToValue}
      value={item.itemValue}
      onClick={handleClick}
      onRename={handleRename}
      onLoad={handleLoad}
      onRemove={handleRemove}
    />
  ) : null;
}

function BackEndItem({
  value,
  fetchUrl,
  pathToValue,
  formatter,
  label,
  isDefault,
  onClick: handleClick,
  onRemove: handleRemove,
  onRename: handleRename,
  onLoad: handleLoad,
}: {
  readonly value: number | string | undefined;
  readonly fetchUrl: string;
  readonly pathToValue: keyof BackendStatsResult;
  readonly label: string;
  readonly isDefault: boolean;
  readonly formatter: (rawValue: any) => string;
  readonly onClick: (() => void) | undefined;
  readonly onRemove: (() => void) | undefined;
  readonly onRename: ((newLabel: string) => void) | undefined;
  readonly onLoad: ((value: number | string) => void) | undefined;
}): JSX.Element {
  const promiseGenerator = React.useCallback(
    () =>
      throttledPromise<BackendStatsResult, string>(
        'backendStats',
        async () =>
          ajax<BackendStatsResult>(fetchUrl, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          }).then(({ data }) => data),
        fetchUrl
      ).then((data) => formatter(data[pathToValue])),
    [pathToValue, fetchUrl]
  );
  useStatValueLoad(value, promiseGenerator, handleLoad);
  return (
    <StatsResult
      isDefault={isDefault}
      query={undefined}
      label={label}
      value={value}
      onClick={handleClick}
      onRename={handleRename}
      onRemove={handleRemove}
      onEdit={undefined}
    />
  );
}

function QueryItem({
  value,
  label,
  querySpec,
  onClick: handleClick,
  onRemove: handleRemove,
  onEdit: handleEdit,
  onRename: handleRename,
  isDefault,
  onLoad: handleLoad,
}: {
  readonly value: number | string | undefined;
  readonly querySpec: QuerySpec;
  readonly label: string;
  readonly isDefault: boolean;
  readonly onClick: (() => void) | undefined;
  readonly onRemove: (() => void) | undefined;
  readonly onEdit: ((querySpec: QuerySpec) => void) | undefined;
  readonly onRename: ((newLabel: string) => void) | undefined;
  readonly onLoad: ((value: number | string) => void) | undefined;
}): JSX.Element | null {
  const query = React.useMemo(
    () => querySpecToResource(label, querySpec),
    [label, querySpec]
  );

  const promiseGenerator = React.useCallback(
    async () =>
      throttledPromise<number | string | undefined, string>(
        'queryStats',
        queryCountPromiseGenerator(query),
        JSON.stringify(querySpec)
      ),
    [query]
  );

  useStatValueLoad(value, promiseGenerator, handleLoad);

  return (
    <StatsResult
      isDefault={isDefault}
      query={query}
      label={label}
      value={value}
      onClick={handleClick}
      onRename={handleRename}
      onRemove={handleRemove}
      onEdit={handleEdit}
    />
  );
}
