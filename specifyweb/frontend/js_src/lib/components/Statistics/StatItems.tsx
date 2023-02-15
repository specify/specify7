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
} from './types';
import { hasTablePermission } from '../Permissions/helpers';
import { userText } from '../../localization/user';
import { Http } from '../../utils/ajax/definitions';
import { Tables } from '../DataModel/types';

const overRideValue = (
  tableName: keyof Tables,
  value: string | number | undefined
) => (hasTablePermission(tableName, 'read') ? value : userText.noPermission());

export function StatItem({
  item,
  categoryIndex,
  itemIndex,
  onRemove: handleRemove,
  onClick: handleClick,
  onEdit: handleEdit,
  onLoad: onLoad,
  onRename: handleRename,
}: {
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
  const resolvedSpec = useResolvedStatSpec(item);

  return resolvedSpec?.type === 'QueryBuilderStat' &&
    resolvedSpec.querySpec !== undefined ? (
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
            }
          : undefined
      }
      onLoad={handleLoad}
      onRemove={handleRemove}
      onRename={handleRename}
    />
  ) : item?.type === 'DefaultStat' &&
    resolvedSpec?.type === 'BackEndStat' &&
    resolvedSpec?.pathToValue !== undefined ? (
    <BackEndItem
      tableName={resolvedSpec.tableName}
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
  tableName,
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
  readonly pathToValue: string;
  readonly tableName: keyof Tables;
  readonly label: string;
  readonly isDefault: boolean;
  readonly formatter: (rawValue: any) => string | undefined;
  readonly onClick: (() => void) | undefined;
  readonly onRemove: (() => void) | undefined;
  readonly onRename: ((newLabel: string) => void) | undefined;
  readonly onLoad: ((value: number | string) => void) | undefined;
}): JSX.Element {
  const overRiddenValue = overRideValue(tableName, value);
  const promiseGenerator = React.useCallback(
    () =>
      throttledPromise<BackendStatsResult | undefined>(
        'backendStats',
        async () =>
          ajax<BackendStatsResult | undefined>(
            fetchUrl,
            {
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
            },
            { expectedResponseCodes: [Http.OK, Http.FORBIDDEN] }
          ).then(({ data, status }) =>
            status === Http.FORBIDDEN ? undefined : data
          ),
        fetchUrl
      ).then((data) => {
        const fetchValue =
          data === undefined
            ? userText.noPermission()
            : formatter?.(data[pathToValue]);
        if (fetchValue === undefined) handleRemove?.();
        return fetchValue;
      }),
    [pathToValue, fetchUrl, handleRemove]
  );
  useStatValueLoad(overRiddenValue, promiseGenerator, handleLoad);
  return (
    <StatsResult
      isDefault={isDefault}
      query={undefined}
      label={label}
      value={overRiddenValue}
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
  const overRiddenValue = overRideValue(querySpec.tableName, value);

  const query = React.useMemo(
    () => querySpecToResource(label, querySpec),
    [label, querySpec]
  );

  const promiseGenerator = React.useCallback(
    async () =>
      throttledPromise<number | string | undefined>(
        'queryStats',
        queryCountPromiseGenerator(query),
        JSON.stringify(querySpec)
      ),
    [query]
  );

  useStatValueLoad(overRiddenValue, promiseGenerator, handleLoad);

  return (
    <StatsResult
      isDefault={isDefault}
      query={
        hasTablePermission(querySpec.tableName, 'read') ? query : undefined
      }
      label={label}
      value={overRiddenValue}
      onClick={handleClick}
      onRename={handleRename}
      onRemove={handleRemove}
      onEdit={handleEdit}
    />
  );
}
