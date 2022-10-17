import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import type { SpQueryField, Tables } from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { RA } from '../../utils/types';
import { StatCategoryReturn, statsSpec } from './StatsSpec';
import {
  BackendStatsResult,
  useFrontEndStat,
  FrontEndStatsResult,
  useFrontEndStatsQuery,
} from './utils';
import { H2, H3 } from '../Atoms';
import { statsText } from '../../localization/stats';

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

export function StatsPage(): JSX.Element {
  const backEndResult = useBackendApi();

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto bg-[color:var(--form-background)] p-4">
      <H2 className="text-2xl">{statsText('collectionStatistics')}</H2>

      <div className="grid h-full grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
        {Object.entries(statsSpec).map(
          ([categoryName, { label, categories }]) => {
            const statObject = (
              categories as (
                backendStatsResult:
                  | BackendStatsResult[typeof categoryName]
                  | undefined
              ) => StatCategoryReturn
            )(backEndResult?.[categoryName]);
            return (
              <div
                key={categoryName}
                className="block content-center rounded border-[1px] border-black bg-white p-4"
              >
                <H3 className="font-bold">{label}</H3>

                {statObject === undefined
                  ? commonText('loading')
                  : Object.entries(statObject).map(
                      ([itemName, { label, spec }]) => {
                        const statValue =
                          spec.type === 'Querybuildstat' ? (
                            <QueryBuilderStat
                              tableName={spec.tableName}
                              fields={spec.fields}
                              statLabel={label}
                            />
                          ) : (
                            spec.value ?? commonText('loading')
                          );
                        return (
                          <p key={itemName} className="flex justify-between">
                            <span>{label}</span>
                            <span>{statValue ?? commonText('loading')}</span>
                          </p>
                        );
                      }
                    )}
              </div>
            );
          }
        )}
      </div>
    </div>
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
