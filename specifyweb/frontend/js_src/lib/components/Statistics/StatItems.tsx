import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { statsText } from '../../localization/stats';
import { userText } from '../../localization/user';
import type { AjaxResponseObject } from '../../utils/ajax';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { throttledPromise } from '../../utils/ajax/throttledPromise';
import { localized } from '../../utils/types';
import { formatNumber } from '../Atoms/Internationalization';
import { serializeResource } from '../DataModel/serializers';
import { getNoAccessTables } from '../QueryBuilder/helpers';
import {
  makeSerializedFieldsFromPaths,
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
  StatFormatterSpec,
} from './types';

export function StatItem({
  item,
  categoryIndex,
  itemIndex,
  formatterSpec,
  hasPermission,
  onRemove: handleRemove,
  onClick: handleClick,
  onEdit: handleEdit,
  onLoad: handleLoad,
  onRename: handleRename,
  onClone: handleClone,
}: {
  readonly item: CustomStat | DefaultStat;
  readonly formatterSpec: StatFormatterSpec;
  readonly categoryIndex: number;
  readonly itemIndex: number;
  readonly hasPermission: boolean;
  readonly onRemove: (() => void) | undefined;
  readonly onClick: (() => void) | undefined;
  readonly onEdit:
    | ((querySpec: QuerySpec, itemName: LocalizedString) => void)
    | undefined;
  readonly onLoad:
    | ((
        categoryIndex: number,
        itemIndex: number,
        value: number | string
      ) => void)
    | undefined;
  readonly onRename: ((newLabel: string) => void) | undefined;
  readonly onClone: (() => void) | undefined;
}): JSX.Element | null {
  const handleLoadItem = React.useCallback(
    (value: number | string) => handleLoad?.(categoryIndex, itemIndex, value),
    [handleLoad, categoryIndex, itemIndex]
  );
  const resolvedSpec = useResolvedStatSpec(item, formatterSpec);

  return resolvedSpec?.type === 'QueryStat' &&
    resolvedSpec.querySpec !== undefined ? (
    <QueryItem
      hasPermission={hasPermission}
      label={item.label}
      querySpec={resolvedSpec.querySpec}
      value={item.itemValue}
      onClick={handleClick}
      onClone={handleClone}
      onEdit={
        handleEdit === undefined
          ? undefined
          : (querySpec): void => handleEdit(querySpec, localized(item.label))
      }
      onLoad={handleLoadItem}
      onRemove={handleRemove}
      onRename={handleRename}
    />
  ) : item?.type === 'DefaultStat' &&
    resolvedSpec?.type === 'BackEndStat' &&
    resolvedSpec?.pathToValue !== undefined ? (
    <BackEndItem
      fetchUrl={resolvedSpec.fetchUrl}
      formatter={resolvedSpec.formatter}
      hasPermission={hasPermission}
      label={item.label}
      pathToValue={resolvedSpec.pathToValue.toString()}
      querySpec={resolvedSpec.querySpec}
      value={item.itemValue}
      onClick={handleClick}
      onClone={handleClone}
      onLoad={handleLoadItem}
      onRemove={handleRemove}
      onRename={handleRename}
    />
  ) : null;
}

function BackEndItem({
  value,
  fetchUrl,
  pathToValue,
  formatter,
  label,
  querySpec,
  hasPermission,
  onClick: handleClick,
  onRemove: handleRemove,
  onRename: handleRename,
  onLoad: handleLoad,
  onClone: handleClone,
}: {
  readonly value: number | string | undefined;
  readonly fetchUrl: string;
  readonly pathToValue: string;
  readonly label: string;
  readonly querySpec: QuerySpec | undefined;
  readonly hasPermission: boolean;
  readonly formatter: (rawValue: any) => string | undefined;
  readonly onClick: (() => void) | undefined;
  readonly onRemove: (() => void) | undefined;
  readonly onRename: ((newLabel: string) => void) | undefined;
  readonly onLoad: ((value: number | string) => void) | undefined;
  readonly onClone: (() => void) | undefined;
}): JSX.Element {
  const statStateRef = React.useMemo(
    () =>
      querySpec === undefined ||
      getNoAccessTables(
        makeSerializedFieldsFromPaths(querySpec.tableName, querySpec.fields)
      ).length === 0,
    [querySpec]
  );

  const [hasStatPermission, setStatPermission] =
    React.useState<boolean>(statStateRef);
  const handleLoadResolve = hasStatPermission ? handleLoad : undefined;

  const promiseGenerator = React.useCallback(
    async () =>
      throttledPromise<BackendStatsResult | undefined>(
        'backendStats',
        async () =>
          ajax<BackendStatsResult | undefined>(fetchUrl, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            expectedErrors: [Http.FORBIDDEN],
          }).then(({ data, status }) => {
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
      hasPermission={hasPermission}
      label={label}
      query={
        querySpec === undefined
          ? undefined
          : querySpecToResource(label, querySpec)
      }
      value={hasStatPermission ? value : userText.noPermission()}
      onClick={handleClick}
      onClone={handleClone}
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
  hasPermission,
  onClick: handleClick,
  onRemove: handleRemove,
  onEdit: handleEdit,
  onRename: handleRename,
  onLoad: handleLoad,
  onClone: handleClone,
}: {
  readonly value: number | string | undefined;
  readonly querySpec: QuerySpec;
  readonly label: string;
  readonly hasPermission: boolean;
  readonly onClick: (() => void) | undefined;
  readonly onRemove: (() => void) | undefined;
  readonly onEdit: ((querySpec: QuerySpec) => void) | undefined;
  readonly onRename: ((newLabel: string) => void) | undefined;
  readonly onLoad: ((value: number | string) => void) | undefined;
  readonly onClone: (() => void) | undefined;
}): JSX.Element | null {
  const query = React.useMemo(
    () => querySpecToResource(label, querySpec),
    [label, querySpec]
  );
  const serializedQuery = serializeResource(query);
  const statStateRef = React.useMemo(
    () =>
      getNoAccessTables(serializedQuery.fields).length === 0
        ? 'valid'
        : 'noPermission',
    [querySpec]
  );

  const [statState, setStatState] = React.useState<
    'error' | 'noPermission' | 'valid'
  >(statStateRef);

  React.useEffect(() => {
    setStatState(statStateRef);
  }, [querySpec]);
  const handleLoadResolve = statState === 'valid' ? handleLoad : undefined;
  const promiseGenerator = React.useCallback(
    async () =>
      throttledPromise<AjaxResponseObject<{ readonly count: number }>>(
        'queryStats',
        queryCountPromiseGenerator(serializedQuery),
        JSON.stringify(querySpec)
      ).then((response) => {
        if (response === undefined) return undefined;
        const { data, status } = response;
        if (status === Http.OK) {
          setStatState('valid');
          return formatNumber(data.count);
        }
        setStatState(status === Http.FORBIDDEN ? 'noPermission' : 'error');
        return undefined;
      }),

    [query, setStatState]
  );

  useStatValueLoad(value, promiseGenerator, handleLoadResolve);

  return (
    <StatsResult
      hasPermission={hasPermission}
      label={label}
      query={query}
      value={
        statState === 'noPermission'
          ? userText.noPermission()
          : statState === 'error'
          ? statsText.error()
          : value
      }
      onClick={handleClick}
      onClone={handleClone}
      onEdit={handleEdit}
      onRemove={handleRemove}
      onRename={handleRename}
    />
  );
}
