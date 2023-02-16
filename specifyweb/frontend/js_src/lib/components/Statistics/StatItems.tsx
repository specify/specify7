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
  const [hasStatPermission, setStatPermission] = React.useState<boolean>(
    hasTablePermission(tableName, 'read')
  );
  const handleLoadResolve = hasStatPermission ? handleLoad : undefined;
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
          ).then(({ data, status }) => {
            if (status === Http.FORBIDDEN) {
              setStatPermission(false);
              return undefined;
            }
            return data;
          }),
        fetchUrl
      ).then((data) => {
        if (data === undefined) {
          return undefined;
        }
        const fetchValue = formatter?.(data[pathToValue]);
        if (fetchValue === undefined) handleRemove?.();
        return fetchValue;
      }),
    [pathToValue, fetchUrl, handleRemove]
  );
  useStatValueLoad(value, promiseGenerator, handleLoadResolve);
  return (
    <StatsResult
      isDefault={isDefault}
      query={undefined}
      label={label}
      value={hasStatPermission ? value : userText.noPermission()}
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
  const [hasStatPermission, setStatPermission] = React.useState<boolean>(
    hasTablePermission(querySpec.tableName, 'read')
  );
  const handleLoadResolve = hasStatPermission ? handleLoad : undefined;
  const query = React.useMemo(
    () => querySpecToResource(label, querySpec),
    [label, querySpec]
  );

  const promiseGenerator = React.useCallback(
    async () =>
      throttledPromise<number | string | undefined>(
        'queryStats',
        queryCountPromiseGenerator(query, setStatPermission),
        JSON.stringify(querySpec)
      ),
    [query]
  );

  useStatValueLoad(value, promiseGenerator, handleLoadResolve);

  return (
    <StatsResult
      isDefault={isDefault}
      query={hasStatPermission ? query : undefined}
      label={label}
      value={hasStatPermission ? value : userText.noPermission()}
      onClick={handleClick}
      onRename={handleRename}
      onRemove={handleRemove}
      onEdit={handleEdit}
    />
  );
}
