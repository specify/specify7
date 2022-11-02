import React from 'react';
import type { State } from 'typesafe-reducer';
import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { ajax } from '../../utils/ajax';
import type { IR, RA } from '../../utils/types';
import { H2, H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import type { SerializedResource } from '../DataModel/helperTypes';
import { fetchResource } from '../DataModel/resource';
import type { SpQueryField, Tables } from '../DataModel/types';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { usePref } from '../UserPreferences/usePref';
import { StatLayout } from './definitions';
import type { StatCategoryReturn } from './StatsSpec';
import { statsSpec } from './StatsSpec';
import type { BackendStatsResult } from './utils';
import {
  FrontEndStatsResult,
  useFrontEndStat,
  useFrontEndStatsQuery,
} from './utils';
import { QueryList } from '../Toolbar/Query';
import { removeItem, replaceItem } from '../../utils/utils';

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

function useStatsSpec(): IR<{
  readonly label: string;
  readonly items: StatCategoryReturn;
}> {
  const backEndResult = useBackendApi();
  return React.useMemo(
    () =>
      Object.fromEntries(
        Object.entries(statsSpec).map(
          ([categoryName, { label, categories }]) => [
            categoryName,
            {
              label,
              items: (
                categories as (
                  backendStatResult:
                    | BackendStatsResult[typeof categoryName]
                    | undefined
                ) => StatCategoryReturn
              )(backEndResult?.[categoryName]),
            },
          ]
        )
      ),
    [backEndResult]
  );
}

export function StatsPage(): JSX.Element {
  const [customLayout, setLayout] = usePref(
    'statistics',
    'appearance',
    'layout'
  );
  const statsSpec = useStatsSpec();
  const defaultLayout = useDefaultLayout(statsSpec);
  const layout = customLayout ?? defaultLayout;
  const [state, setState] = React.useState<
    | State<
        'EditingState',
        {
          readonly addingItem:
            | {
                readonly pageName: string;
                readonly categoryName: string;
              }
            | undefined;
        }
      >
    | State<'DefaultState'>
  >({ type: 'DefaultState' });
  const isEditing = state.type === 'EditingState';
  return (
    <div className="h-full w-full bg-[color:var(--form-background)]">
      <div className="mx-auto flex h-full max-w-[min(100%,var(--form-max-width))] flex-col gap-4 overflow-y-auto  p-4 ">
        <div className="flex items-center gap-2">
          <H2 className="text-2xl">{statsText('collectionStatistics')}</H2>
          <span className="-ml-2 flex-1" />
          {isEditing && (
            <Button.Red onClick={(): void => setLayout(defaultLayout)}>
              {commonText('reset')}
            </Button.Red>
          )}
          <Button.Green
            onClick={(): void =>
              setState(
                isEditing
                  ? { type: 'DefaultState' }
                  : {
                      type: 'EditingState',
                      addingItem: undefined,
                    }
              )
            }
          >
            {isEditing ? commonText('save') : commonText('edit')}
          </Button.Green>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
          {layout[0].categories.map(({ label, items }, categoryIndex) => (
            <div
              className="block h-auto max-h-80 content-center rounded border-[1px] border-black bg-white p-4"
              key={categoryIndex}
            >
              <H3 className="font-bold">{label}</H3>
              {items?.map((item, itemIndex) => {
                const handleRemove = (): void =>
                  setLayout(
                    replaceItem(layout, 0, {
                      ...layout[0],
                      categories: replaceItem(
                        layout[0].categories,
                        categoryIndex,
                        {
                          ...layout[0].categories[categoryIndex],
                          items: removeItem(items, itemIndex),
                        }
                      ),
                    })
                  );

                return item.type === 'DefaultStat' ? (
                  <DefaultStat
                    key={itemIndex}
                    statsSpec={statsSpec}
                    categoryName={item.categoryName}
                    itemName={item.itemName}
                    onRemove={isEditing ? handleRemove : undefined}
                  />
                ) : (
                  <CustomStat
                    key={itemIndex}
                    queryId={item.queryId}
                    onRemove={isEditing ? handleRemove : undefined}
                  />
                );
              })}
              {isEditing && (
                <Button.LikeLink>
                  <span className={className.dataEntryAdd}>{icons.plus}</span>
                  {commonText('add')}
                </Button.LikeLink>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**function AddStat(closeCallBack, customCallBack, defaultCallBack) {
  <QueryList
    queries={}
    isReadOnly={true}
    getQuerySelectCallback={(query) => () => {
      customCallBack(query);
    }}
  ></QueryList>;
} **/

function useDefaultLayout(
  statsSpec: IR<{
    readonly label: string;
    readonly items: StatCategoryReturn | undefined;
  }>
): StatLayout {
  return React.useMemo(
    () => [
      {
        label: 'collection',
        categories: Object.entries(statsSpec).map(
          ([categoryName, { label, items }]) => ({
            label,
            items: Object.entries(items ?? {}).map(([itemName]) => ({
              type: 'DefaultStat',
              pageName: 'collection',
              categoryName,
              itemName,
            })),
          })
        ),
      },
    ],
    [statsSpec]
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
  readonly statsSpec: IR<{
    readonly label: string;
    readonly items: StatCategoryReturn;
  }>;
  readonly categoryName: keyof typeof statsSpec;
  readonly itemName: string;
  readonly onRemove: (() => void) | undefined;
}): JSX.Element {
  const statSpecItemObject = statsSpec[categoryName]?.items;
  const statSpecItem =
    statSpecItemObject === undefined ? undefined : statSpecItemObject[itemName];
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
  readonly value: JSX.Element | number | string | undefined;
  readonly onRemove: (() => void) | undefined;
}): JSX.Element {
  return (
    <>
      {label === undefined ? (
        <div>{commonText('loading')}</div>
      ) : (
        <p className="flex gap-2">
          {typeof handleRemove === 'function' && (
            <Button.Icon
              icon="trash"
              title={commonText('remove')}
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
  readonly onRemove: (() => void) | undefined;
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
  const frontEndQuery = useFrontEndStatsQuery(tableName, fields);
  const frontEndStatValue = useFrontEndStat(frontEndQuery);
  return frontEndStatValue === undefined ? (
    <>{commonText('loading')}</>
  ) : (
    <FrontEndStatsResult
      query={frontEndQuery}
      statLabel={statLabel}
      statValue={frontEndStatValue}
    />
  );
}
