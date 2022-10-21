import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import type { SpQueryField, Tables } from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { IR, RA } from '../../utils/types';
import { StatCategoryReturn, statsSpec } from './StatsSpec';
import { usePref } from '../UserPreferences/usePref';
import {
  BackendStatsResult,
  useFrontEndStat,
  FrontEndStatsResult,
  useFrontEndStatsQuery,
} from './utils';
import { H2, H3 } from '../Atoms';
import { statsText } from '../../localization/stats';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { SpQuery } from '../DataModel/types';
import { fetchResource } from '../DataModel/resource';
import { deserializeResource } from '../../hooks/resource';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { Submit } from '../Atoms/Submit';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { handleAjaxError } from '../Errors/FormatError';
import { useBooleanState } from '../../hooks/useBooleanState';
import { defaultStatLayout } from './definitions';
import { preferencesText } from '../../localization/preferences';

function useBackendApi(): BackendStatsResult | undefined {
  const [backendStatObject] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<BackendStatsResult>('/statistics/collection/global/', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }).then(({ data }) => data),
      []
    ),
    false
  );
  return backendStatObject;
}

function useStatsSpec(): IR<StatCategoryReturn> {
  const backEndResult = useBackendApi();
  return React.useMemo(
    () =>
      Object.fromEntries(
        Object.entries(statsSpec).map(([categoryName, { categories }]) => [
          categoryName,
          (
            categories as (
              backendStatResult:
                | BackendStatsResult[typeof categoryName]
                | undefined
            ) => StatCategoryReturn
          )(backEndResult?.[categoryName]),
        ])
      ),
    [backEndResult]
  );
}

export function StatsPage(): JSX.Element {
  const [layout, setLayout] = usePref('statistics', 'appearance', 'layout');
  const [isEditing, _, __, handleToggle] = useBooleanState();
  const statsSpec = useStatsSpec();
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto bg-[color:var(--form-background)] p-4">
      <div className="flex gap-2">
        <H2 className="text-2xl">{statsText('collectionStatistics')}</H2>
        <span className="-ml-2 flex-1" />
        {isEditing && (
          <Button.Red onClick={(): void => setLayout(defaultStatLayout)}>
            {commonText('reset')}
          </Button.Red>
        )}
        <Button.Green onClick={handleToggle}>
          {isEditing ? commonText('save') : commonText('edit')}
        </Button.Green>
      </div>

      <div className="grid h-full grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
        {Object.entries(layout.collection).map(([categoryLabel, items]) => {
          return (
            <div
              key={categoryLabel}
              className="block h-min content-center rounded border-[1px] border-black bg-white p-4"
            >
              <H3 className="font-bold">{categoryLabel}</H3>
              {items?.map((item, itemIndex) => {
                const handleRemove = (): void =>
                  setLayout({
                    ...layout,
                    collection: {
                      ...layout.collection,
                      [categoryLabel]: layout.collection[categoryLabel].filter(
                        (_, index) => itemIndex !== index
                      ),
                    },
                  });

                if (item.type === 'DefaultStat') {
                  return (
                    <DefaultStat
                      statsSpec={statsSpec}
                      categoryName={item.categoryName}
                      itemName={item.itemName}
                      key={itemIndex}
                      onRemove={isEditing ? handleRemove : undefined}
                    />
                  );
                } else
                  return (
                    <CustomStat
                      queryId={item.queryId}
                      key={itemIndex}
                      onRemove={isEditing ? handleRemove : undefined}
                    />
                  );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function useCustomStatQueryBuilderSpec(queryId: number):
  | {
      readonly tableName: keyof Tables;
      readonly fields: RA<
        Partial<SerializedResource<SpQueryField>> & { readonly path: string }
      >;
      readonly label: string;
    }
  | undefined {
  const [data] = useAsyncState(
    React.useCallback(
      async () =>
        fetchResource('SpQuery', queryId).then((queryData) => ({
          tableName: queryData.contextName as keyof Tables,
          fields: queryData.fields.map((field) => ({
            ...field,
            path: QueryFieldSpec.fromStringId(
              field.stringId,
              field.isRelFld ?? false
            )
              .toMappingPath()
              .join('.'),
          })),
          label: queryData.name,
        })),
      [queryId]
    ),
    false
  );
  return data;
}

function DefaultStat({
  statsSpec,
  categoryName,
  itemName,
  onRemove: handleRemove,
}: {
  readonly statsSpec: IR<StatCategoryReturn>;
  readonly categoryName: keyof typeof statsSpec;
  readonly itemName: string;
  readonly onRemove: undefined | (() => void);
}): JSX.Element {
  const statSpecItem = statsSpec[categoryName]?.[itemName];
  const statValue =
    statSpecItem === undefined ? undefined : statSpecItem.spec.type ===
      'Querybuildstat' ? (
      <QueryBuilderStat
        tableName={statSpecItem.spec.tableName}
        fields={statSpecItem.spec.fields}
        statLabel={statSpecItem.label}
      />
    ) : (
      statSpecItem.spec.value ?? commonText('loading')
    );
  return (
    <StatItemDisplay
      label={statSpecItem?.label}
      value={statValue}
      onRemove={handleRemove}
    />
  );
}

function StatItemDisplay({
  label,
  value,
  onRemove: handleRemove,
}: {
  readonly label: string | undefined;
  readonly value: JSX.Element | string | number | undefined;
  readonly onRemove: undefined | (() => void);
}): JSX.Element {
  return (
    <>
      {label === undefined ? (
        commonText('loading')
      ) : (
        <p className="flex gap-2">
          {typeof handleRemove === 'function' && (
            <Button.Icon
              title={commonText('remove')}
              icon="trash"
              onClick={handleRemove}
            />
          )}

          <span>{label}</span>
          <span className="-ml-2 flex-1" />
          <span>{value ?? commonText('loading')}</span>
        </p>
      )}
    </>
  );
}

function CustomStat({
  queryId,
  onRemove: handleRemove,
}: {
  readonly queryId: number;
  readonly onRemove: undefined | (() => void);
}): JSX.Element {
  const { tableName, fields, label } =
    useCustomStatQueryBuilderSpec(queryId) ?? {};
  const statValue =
    tableName === undefined ||
    fields === undefined ||
    label === undefined ? undefined : (
      <QueryBuilderStat
        tableName={tableName}
        fields={fields}
        statLabel={label}
      />
    );
  return (
    <StatItemDisplay label={label} value={statValue} onRemove={handleRemove} />
  );
}

function QueryBuilderStat({
  tableName,
  fields,
  statLabel,
}: {
  readonly tableName: keyof Tables;
  readonly fields: RA<
    Partial<SerializedResource<SpQueryField>> & { readonly path: string }
  >;
  readonly statLabel: string;
}): JSX.Element {
  const frontEndQuery = useFrontEndStatsQuery(
    tableName,
    React.useMemo(() => fields, [])
  );
  const frontEndStatValue = useFrontEndStat(frontEndQuery);
  return frontEndStatValue === undefined ? (
    <>{commonText('loading')}</>
  ) : (
    <FrontEndStatsResult
      statValue={frontEndStatValue}
      query={frontEndQuery}
      statLabel={statLabel}
    />
  );
}
