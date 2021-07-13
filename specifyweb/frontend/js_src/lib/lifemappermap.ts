import $ from 'jquery';

import type { R, RA, RR } from './components/wbplanview';
import csrftoken from './csrftoken';
import type { MarkerGroups } from './leaflet';
import * as Leaflet from './leaflet';
import type { MessageTypes } from './lifemapperconfig';
import type { MapInfo } from './lifemapperreducer';
import type { LifemapperLayerTypes } from './lifemapperutills';
import {
  formatOccurrenceMapRequest,
  lifemapperLayerVariations,
} from './lifemapperutills';
import {
  formatLocalityDataObject,
  getLocalityDataFromLocalityResource,
  parseLocalityPinFields,
} from './localityrecorddataextractor';
import lifemapperText from './localization/lifemapper';
import schema from './schema';
import fetchDataModel from './wbplanviewmodelfetcher';

export async function prepareLifemapperProjectionMap(
  getOccurrenceName: (preferredElement: 0 | 1) => string,
  model: any
): Promise<MapInfo> {
  const messages: RR<MessageTypes, R<string>> = {
    errorDetails: {},
    infoSection: {
      speciesName: getOccurrenceName(1),
    },
  };

  const similarCoMarkersPromise = new Promise<RA<MarkerGroups>>(
    async (resolve) => {
      await fetchDataModel();

      const determination = await model.rget('determinations');

      const currentDetermination = determination.models.find((model: any) =>
        model.get('iscurrent')
      );

      if (typeof currentDetermination === 'undefined') resolve([]);

      const taxon = await currentDetermination.rget('taxon');

      const LIMIT = 10_000;

      const parsedLocalityFields = parseLocalityPinFields(true);

      const request = await fetch('/stored_query/ephemeral/', {
        headers: { 'X-CSRFToken': csrftoken! },
        method: 'POST',
        body: JSON.stringify({
          name: 'Lifemapper Local Occurrence query',
          contextname: 'CollectionObject',
          contexttableid: 1,
          limit: LIMIT + 1,
          selectdistinct: true,
          countonly: false,
          specifyuser: '/api/specify/specifyuser/1/',
          isfavorite: true,
          ordinal: 32_767,
          formatauditrecids: false,
          fields: [
            {
              tablelist: '1,9-determinations,4',
              stringid: '1,9-determinations,4.taxon.taxonid',
              fieldname: 'taxonid',
              isrelfld: false,
              sorttype: 0,
              isdisplay: false,
              isnot: false,
              startvalue: `${taxon.get('id')}`,
              operstart: 1,
              position: 0,
            },
            {
              tablelist: '1,9-determinations',
              stringid: '1,9-determinations.determination.isCurrent',
              fieldname: 'isCurrent',
              isrelfld: false,
              sorttype: 0,
              isdisplay: false,
              isnot: false,
              startvalue: '',
              operstart: 6,
              position: 1,
            },
            {
              sorttype: 0,
              isdisplay: true,
              isnot: false,
              startvalue: '',
              query: '/api/specify/spquery/',
              position: 2,
              tablelist: '1,10,2',
              stringid: '1,10,2.locality.localityid',
              fieldname: 'localityid',
              isrelfld: false,
              operstart: 1,
            },
            ...parsedLocalityFields.map(([fieldName]) => ({
              sorttype: 0,
              isdisplay: true,
              isnot: false,
              startvalue: '',
              query: '/api/specify/spquery/',
              position: 3,
              tablelist: '1,10,2',
              stringid: `1,10,2.locality.${fieldName}`,
              fieldname: fieldName,
              isrelfld: false,
              operstart: 1,
            })),
          ],
          offset: 0,
        }),
      });

      const results: {
        readonly results: RA<[number, number, ...RA<string>]>;
      } = await request.json();

      if (results.results.length > LIMIT)
        messages.errorDetails.overLimitMessage = `<b style="color:#f00">
          ${lifemapperText('overLimitMessage')(LIMIT)}
        </b>`;

      let currentLocalityId: undefined | number;
      const localities = await Promise.all(
        results.results
          .slice(0, LIMIT)
          .map(([collectionObjectId, localityId, ...localityData]) => {
            if (collectionObjectId === model.get('id'))
              currentLocalityId = localityId;

            return {
              collectionObjectId,
              localityId,
              localityData: formatLocalityDataObject(
                parsedLocalityFields.map((mappingPath, index) => [
                  mappingPath,
                  localityData[index],
                ])
              ),
              fetchLocalityResource: async () =>
                new Promise<any>((resolve) => {
                  const locality = new (
                    schema as any
                  ).models.Locality.LazyCollection({
                    filters: { id: localityId },
                  });
                  locality
                    .fetch({ limit: 1 })
                    .then(() => resolve(locality.models[0]));
                }),
            };
          })
      );

      const fetchedPopUps: number[] = [];
      const markers = await Promise.all(
        localities.map(
          (
            {
              collectionObjectId,
              localityId,
              localityData,
              fetchLocalityResource,
            },
            index
          ) =>
            localityData === false
              ? undefined
              : Leaflet.getMarkersFromLocalityData({
                  localityData,
                  iconClass:
                    localityId === currentLocalityId
                      ? 'lifemapper-current-collection-object-marker'
                      : undefined,
                  markerClickCallback: async ({ target: marker }) => {
                    if (fetchedPopUps.includes(index)) return;
                    const localityResource = await fetchLocalityResource();
                    const localityData =
                      await getLocalityDataFromLocalityResource(
                        localityResource,
                        false,
                        (_mappingPathParts, resource) =>
                          typeof resource?.specifyModel?.name !== 'string' ||
                          resource.specifyModel.name !== 'CollectionObject' ||
                          resource.get('id') === collectionObjectId
                      );
                    if (localityData !== false)
                      marker
                        .getPopup()
                        .setContent(
                          Leaflet.formatLocalityData(
                            localityData,
                            `/specify/view/collectionobject/${collectionObjectId}/`,
                            true
                          )
                        );
                    fetchedPopUps.push(index);
                  },
                })
        )
      );

      resolve(
        markers.filter(
          (result): result is MarkerGroups => typeof result !== 'undefined'
        )
      );
    }
  );

  const projectionMapResponse: {
    readonly errors: string[];
    readonly records: [
      {
        readonly records: {
          readonly 's2n:endpoint': string;
          readonly 's2n:modtime': string;
          readonly 's2n:layer_name': string;
          readonly 's2n:layer_type': LifemapperLayerTypes;
        }[];
      }
    ];
  } = await $.get(formatOccurrenceMapRequest(getOccurrenceName(1)));

  let layers: RA<any> = [];

  if (projectionMapResponse.errors.length > 0)
    projectionMapResponse.errors.forEach((error) => {
      messages.errorDetails[error] = error;
    });
  else if (projectionMapResponse.records[0]?.records.length === 0)
    messages.errorDetails.projectionNotFound =
      lifemapperText('projectionNotFound');
  else {
    const layerCount: R<number> = {};
    layers = projectionMapResponse.records[0].records
      .sort(
        (
          { 's2n:layer_type': layerTypeLeft },
          { 's2n:layer_type': layerTypeRight }
        ) =>
          layerTypeLeft === layerTypeRight
            ? 0
            : layerTypeLeft > layerTypeRight
            ? 1
            : -1
      )
      .map((record) => {
        layerCount[record['s2n:layer_type']] ??= 0;
        layerCount[record['s2n:layer_type']] += 1;

        const layerLabel = `${
          lifemapperLayerVariations[record['s2n:layer_type']].layerLabel
        } (${layerCount[record['s2n:layer_type']]})`;
        return {
          ...lifemapperLayerVariations[record['s2n:layer_type']],
          isDefault: layerCount[record['s2n:layer_type']] === 1,
          layerLabel,
          tileLayer: {
            mapUrl: record['s2n:endpoint'],
            options: {
              layers: record['s2n:layer_name'],
              service: 'wms',
              version: '1.0',
              height: '400',
              format: 'image/png',
              request: 'getmap',
              srs: 'epsg:3857',
              width: '800',
              ...lifemapperLayerVariations[record['s2n:layer_type']],
            },
          },
        };
      });

    const modificationTime =
      projectionMapResponse.records[0].records[0]['s2n:modtime'];
    messages.infoSection.dateCreated = Number.isNaN(new Date(modificationTime))
      ? modificationTime
      : new Date(modificationTime).toLocaleDateString();
  }

  const markers = await similarCoMarkersPromise;
  return {
    markers,
    layers,
    messages,
  };
}
