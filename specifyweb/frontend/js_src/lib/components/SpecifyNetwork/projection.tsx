import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import { ajax } from '../../utils/ajax';
import type { IR, R } from '../../utils/types';
import { filterArray } from '../../utils/types';
import L from '../Leaflet/extend';
import { DateElement } from '../Molecules/DateElement';
import type { RawBrokerResponse } from './fetchers';
import { validateBrokerResponse } from './fetchers';

const maxProjectionLayers = 10;

type RawProjectionResponse = RawBrokerResponse<{
  readonly 's2n:endpoint': string;
  readonly 's2n:modtime': string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly 's2n:layer_name': string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly 's2n:layer_type': 'raster' | 'vector';
  readonly 's2n:sdm_projection_scenario_code'?: string;
}>;

export type BrokerOverlay = {
  readonly layers: IR<L.TileLayer>;
  readonly description: JSX.Element | string;
};

export function useProjectionLayers(
  scientificName: string | undefined
): BrokerOverlay | undefined {
  const [response] = useAsyncState(
    React.useCallback(
      () =>
        scientificName === undefined
          ? undefined
          : ajax<RawProjectionResponse>(
              `/broker/api/v1/map/?namestr=${scientificName}&scenariocode=worldclim-curr&provider=lm`,
              {
                headers: {
                  Accept: 'application/json',
                },
              }
            ).then(({ data }) =>
              !validateBrokerResponse(data) ||
              !validateBrokerResponse(data.records[0])
                ? undefined
                : responseToLayers(data)
            ),
      [scientificName]
    ),
    false
  );
  return response;
}

function responseToLayers(response: RawProjectionResponse): BrokerOverlay {
  const layerCounts: R<number> = {};
  const layers = Object.fromEntries(
    filterArray(
      response.records[0].records
        .filter(
          (record) =>
            record['s2n:sdm_projection_scenario_code'] === 'worldclim-curr' &&
            record['s2n:layer_type'] === 'raster'
        )
        .map((record) => {
          const layerType = record['s2n:layer_type'];
          layerCounts[layerType] ??= 0;
          layerCounts[layerType] += 1;

          if (layerCounts[layerType] > maxProjectionLayers) return undefined;

          const showLayerNumber =
            response.records[0].records.filter(
              (record) => record['s2n:layer_type'] === layerType
            ).length !== 1;

          const label = `${specifyNetworkText.projectionLayerLabel()}${
            showLayerNumber ? ` (${layerCounts[layerType]})` : ''
          }`;

          const tileLayer = L.tileLayer.wms(record['s2n:endpoint'], {
            layers: record['s2n:layer_name'],
            opacity: 0.7,
            transparent: true,
            // @ts-expect-error
            service: 'wms',
            version: '1.0',
            height: '400',
            format: 'image/png',
            request: 'getmap',
            srs: 'epsg:3857',
            width: '800',
          }) as L.TileLayer;

          return [label, tileLayer] as const;
        })
    )
  );

  return {
    layers,
    description: (
      <>
        It also displays a predicted distribution model from Lifemapper. Model
        computed with default Maxent parameters:{' '}
        <DateElement date={response.records[0].records[0]['s2n:modtime']} />
      </>
    ),
  };
}
