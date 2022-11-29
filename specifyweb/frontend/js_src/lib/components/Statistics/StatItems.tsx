import type { SpQueryField, Tables } from '../DataModel/types';
import type { RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import { StatsResult } from './StatsResult';
import { commonText } from '../../localization/common';
import React from 'react';
import {
  useCustomStatQuery,
  useFrontEndStat,
  useFrontEndStatsQuery,
} from './hooks';
import type { StatsSpec } from './types';

export function DefaultStatItem({
  statsSpec,
  pageName,
  categoryName,
  itemName,
  onRemove: handleRemove,
  onClick: handleClick,
}: {
  readonly statsSpec: StatsSpec;
  readonly pageName: string;
  readonly categoryName: keyof typeof statsSpec;
  readonly itemName: string;
  readonly onRemove: (() => void) | undefined;
  readonly onClick: (() => void) | undefined;
}): JSX.Element {
  const statSpecItemPage = statsSpec[pageName];
  const statSpecItemObject = statSpecItemPage[categoryName]?.items;
  const statSpecItem =
    statSpecItemObject === undefined ? undefined : statSpecItemObject[itemName];
  const statValue =
    statSpecItem === undefined ? undefined : statSpecItem.spec.type ===
      'QueryBuilderStat' ? (
      <QueryBuilderStat
        fields={statSpecItem.spec.fields}
        statLabel={statSpecItem.label}
        tableName={statSpecItem.spec.tableName}
        onClick={handleClick}
        onRemove={handleRemove}
      />
    ) : (
      <StatsResult
        query={undefined}
        statLabel={statSpecItem?.label}
        statValue={statSpecItem.spec.value}
        onClick={handleClick}
        onRemove={handleRemove}
      />
    );
  return statValue ?? <p> {commonText('loading')}</p>;
}

export function QueryBuilderStat({
  tableName,
  fields,
  statLabel,
  onRemove: handleRemove,
  onClick: handleClick,
}: {
  readonly tableName: keyof Tables;
  readonly fields: RA<
    Partial<SerializedResource<SpQueryField>> & { readonly path: string }
  >;
  readonly statLabel: string;
  readonly onRemove: (() => void) | undefined;
  readonly onClick: (() => void) | undefined;
}): JSX.Element {
  const frontEndQuery = useFrontEndStatsQuery(tableName, fields);
  const frontEndStatValue = useFrontEndStat(frontEndQuery);
  return frontEndStatValue === undefined ? (
    <p>{commonText('loading')}</p>
  ) : (
    <StatsResult
      query={frontEndQuery}
      statLabel={statLabel}
      statValue={frontEndStatValue}
      onClick={handleClick}
      onRemove={handleRemove}
    />
  );
}

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
  const statValue =
    tableName === undefined ||
    fields === undefined ||
    label === undefined ? undefined : (
      <QueryBuilderStat
        fields={fields}
        statLabel={label}
        tableName={tableName}
        onClick={handleClick}
        onRemove={handleRemove}
      />
    );
  return statValue ?? <p>{commonText('loading')}</p>;
}
