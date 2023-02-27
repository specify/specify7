import React from 'react';

import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { throttledPromise } from '../../utils/ajax/throttledPromise';
import type { Tables } from '../DataModel/types';
import { hasTablePermission } from '../Permissions/helpers';
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

export function StatItem({
  item,
  categoryIndex,
  itemIndex,
  onRemove: handleRemove,
  onClick: handleClick,
  onEdit: handleEdit,
  onLoad,
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
      label={item.label}
      querySpec={resolvedSpec.querySpec}
      value={item.itemValue}
      onClick={handleClick}
      onEdit={
        handleEdit === undefined
          ? undefined
          : (querySpec) => {
              handleEdit(querySpec, item.label);
            }
      }
      onLoad={handleLoad}
      onRemove={handleRemove}
      onRename={handleRename}
    />
  ) : item?.type === 'DefaultStat' &&
    resolvedSpec?.type === 'BackEndStat' &&
    resolvedSpec?.pathToValue !== undefined ? (
    <BackEndItem
      fetchUrl={resolvedSpec.fetchUrl}
      formatter={resolvedSpec.formatter}
      label={item.label}
      pathToValue={resolvedSpec.pathToValue}
      tableName={resolvedSpec.tableName}
      value={item.itemValue}
      onClick={handleClick}
      onLoad={handleLoad}
      onRemove={handleRemove}
      onRename={handleRename}
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
    async () =>
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
      label={label}
      query={undefined}
      value={hasStatPermission ? value : userText.noPermission()}
      onClick={handleClick}
      onEdit={undefined}
      onRemove={handleRemove}
      onRename={handleRename}
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
  onLoad: handleLoad,
}: {
  readonly value: number | string | undefined;
  readonly querySpec: QuerySpec;
  readonly label: string;
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
      label={label}
      query={hasStatPermission ? query : undefined}
      value={hasStatPermission ? value : userText.noPermission()}
      onClick={handleClick}
      onEdit={handleEdit}
      onRemove={handleRemove}
      onRename={handleRename}
    />
  );
}
