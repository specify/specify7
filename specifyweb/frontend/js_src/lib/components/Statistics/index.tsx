import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import type { SpQueryField, Tables } from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { RA } from '../../utils/types';
import { StatCategoryReturn, statsSpec } from './StatsSpec';
import { BackendStatsResult, useStatAjaxHelper } from './utils';

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
  const statsObjectCombined = statsSpec;
  const backEndResult = useBackendApi();

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        gap: '1rem',
        flexDirection: 'column',
        margin: '0 auto',
        padding: '5%',
        paddingTop: '0',
      }}
      className="bg-gray-200"
    >
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 'initial',
        }}
      >
        Collection Statistics
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(20rem,1fr))',
          gridTemplateRows: 'masonry',
          gap: '1rem',
        }}
      >
        {Object.entries(statsObjectCombined).map(function getStatNameCat([
          categoryName,
          { label, categories },
        ]) {
          const statObject = (
            categories as (
              backendStatsResult:
                | BackendStatsResult[typeof categoryName]
                | undefined
            ) => StatCategoryReturn
          )(backEndResult?.[categoryName]);
          return (
            <div
              className="border-[1px] bg-white"
              style={{
                display: 'block',
                borderColor: 'black',
                borderRadius: '1rem',
                padding: '1rem',
                alignContent: 'center',
              }}
            >
              <h1>
                <b>{label}</b>
              </h1>

              {statObject === undefined
                ? commonText('loading')
                : Object.entries(statObject).map(function getstatValue([
                    key,
                    { label, spec },
                  ]) {
                    const statValue =
                      spec.type === 'Querybuildstat' ? (
                        <QueryBuilderStat
                          tableName={spec.tableName}
                          fields={spec.fields}
                        />
                      ) : (
                        spec.value ?? commonText('loading')
                      );
                    return (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}
                      >
                        <h4>{label}</h4>
                        <h6>{statValue}</h6>
                      </div>
                    );
                  })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QueryBuilderStat({
  tableName,
  fields,
}: {
  readonly tableName: keyof Tables;
  readonly fields: RA<
    Partial<SerializedResource<SpQueryField>> & { readonly path: string }
  >;
}): JSX.Element {
  const sss = useStatAjaxHelper(
    tableName,
    React.useMemo(() => fields, [])
  );
  return <>{sss ?? commonText('loading')}</>;
}
