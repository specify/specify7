import L from 'leaflet';
import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { schema } from '../DataModel/schema';
import { userInformation } from '../InitialContext/userInformation';
import type { BrokerRecord } from './fetchers';
import { extractBrokerField } from './fetchers';
import type { BrokerOverlay } from './projection';

export function getGbifLayers(
  name: RA<BrokerRecord>
): BrokerOverlay | undefined {
  const taxonKey = extractBrokerField(name, 'gbif', 's2n:gbif_taxon_key');
  if (taxonKey === undefined) return undefined;

  return {
    layers: {
      [`GBIF ${legendGradient('#ee0', '#d11')}`]: L.tileLayer(
        'https://api.gbif.org/v2/map/occurrence/{source}/{z}/{x}/{y}{format}?{params}',
        {
          attribution: '',
          // @ts-expect-error
          source: 'density',
          format: '@1x.png',
          className: 'saturated',
          params: Object.entries({
            srs: 'EPSG:3857',
            style: 'classic.poly',
            bin: 'hex',
            hexPerTile: 20,
            taxonKey,
          })
            .map(([key, value]) => `${key}=${value}`)

            .join('&'),
        }
      ),
    },
    description: specifyNetworkText.gbifDescription(),
  };
}

const legendGradient = (leftColor: string, rightColor: string): string => `<span
  aria-hidden="true"
  style="--left-color: ${leftColor}; --right-color: ${rightColor}"
  class="leaflet-legend-gradient"
></span>`;

async function getIdbLayer(
  scientificName: string,
  collectionCode: string | undefined,
  layerName: string,
  className?: string
): Promise<IR<L.TileLayer>> {
  let request: Response | undefined;
  try {
    request = await fetch('https://search.idigbio.org/v2/mapping/', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        rq: {
          scientificname: scientificName,
          ...(typeof collectionCode === 'string'
            ? {
                collectioncode: collectionCode,
              }
            : {}),
        },
        type: 'auto',
        threshold: 100_000,
      }),
    });
  } catch {
    return {};
  }
  const response: {
    readonly itemCount: number;
    readonly tiles: string;
  } = await request.json();

  if (response.itemCount === 0) return {};

  return {
    [layerName]: L.tileLayer(response.tiles, {
      attribution: 'iDigBio and the user community',
      className: className ?? 'hyper-saturated',
    }),
  };
}

export function useIdbLayers(
  occurrence: RA<BrokerRecord> | undefined,
  scientificName: string | undefined
): BrokerOverlay | undefined {
  const [layers] = useAsyncState<BrokerOverlay>(
    React.useCallback(() => {
      const idbScientificName =
        extractBrokerField(occurrence ?? [], 'idb', 'dwc:scientificName') ??
        scientificName;
      const collectionCode =
        extractBrokerField(occurrence ?? [], 'idb', 'dwc:collectionCode') ??
        userInformation.availableCollections.find(
          ({ id }) => id === schema.domainLevelIds.collection
        )?.code ??
        undefined;
      if (idbScientificName === undefined) return;
      return f
        .all({
          global: getIdbLayer(
            idbScientificName,
            undefined,
            `iDigBio ${legendPoint('#197')}`
          ),
          collection: getIdbLayer(
            idbScientificName,
            collectionCode,
            `iDigBio (${
              collectionCode ?? 'collection'
            } points only) ${legendPoint('#e68')}`,
            'hue-rotate'
          ),
        })
        .then(({ global, collection }) => ({
          layers: {
            ...global,
            ...collection,
          },
          description: specifyNetworkText.iDigBioDescription(),
        }));
    }, [occurrence]),
    false
  );
  return layers;
}

const legendPoint = (color: string): string => `<span
  aria-hidden="true"
  style="--color: ${color}"
  class="leaflet-legend-point"
></span>`;
