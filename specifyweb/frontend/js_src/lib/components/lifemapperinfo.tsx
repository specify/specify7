import '../../css/lifemapperinfo.css';

import $ from 'jquery';
import React from 'react';

import type { MarkerGroups } from '../leaflet';
import * as Leaflet from '../leaflet';
import type { LocalityData } from '../leafletutils';
import { reducer } from '../lifemapperinforeducer';
import type { LifemapperLayerTypes } from '../lifemapperinfoutills';
import {
  extractBadgeInfo,
  extractElement,
  fetchLocalScientificName,
  formatOccurrenceCountRequest,
  formatOccurrenceDataRequest,
  formatOccurrenceMapRequest,
  lifemapperLayerVariations,
  sourceLabels,
} from '../lifemapperinfoutills';
import { getLocalityDataFromLocalityResource } from '../localityrecorddataextractor';
import ResourceView from '../resourceview';
import schema from '../schema';
import { stateReducer } from './lifemapperinfostate';
import createBackboneView from './reactbackboneextend';
import type { IR, RA, RR } from './wbplanview';
import type { LoadingState } from './wbplanviewstatereducer';

// TODO: remove this
const IS_DEVELOPMENT = false;
const defaultGuid = '2c1becd5-e641-4e83-b3f5-76a55206539a';
// Const defaultGuid = '8eb23b1e-582e-4943-9dd9-e3a36ceeb498';
const defaultOccurrenceName: Readonly<[string, string]> = [
  'Phlox longifolia Nutt.',
  'Phlox longifolia Nutt.',
] as const;

export type MessageTypes = 'errorDetails' | 'infoSection';

export const lifemapperMessagesMeta: RR<
  MessageTypes,
  {
    className: string;
    title: string;
  }
> = {
  errorDetails: {
    className: 'error-details',
    title: 'The following errors were reported by Lifemapper:',
  },
  infoSection: {
    className: 'info-section',
    title: 'Projection Details:',
  },
} as const;

function LifemapperInfo({
  model,
  guid,
}: {
  readonly model: any;
  readonly guid: string | undefined;
}): JSX.Element {
  const [state, dispatch] = React.useReducer(reducer, {
    type: 'LoadingState',
  } as LoadingState);

  React.useEffect(() => {
    if (typeof guid === 'undefined') return;

    fetch(formatOccurrenceDataRequest(guid), {
      mode: 'cors',
    })
      .then((response) => response.json())
      .then(
        (response: {
          readonly records: {
            readonly provider: string;
            readonly count: number;
            readonly records: [] | [IR<unknown>];
          }[];
        }) =>
          dispatch({
            type: 'LoadedAction',
            aggregatorInfos: Object.fromEntries(
              (response.records || [])
                .map((record) => ({
                  ...record,
                  provider: record.provider.toLowerCase(),
                }))
                .filter(
                  (record) =>
                    typeof sourceLabels[record.provider] !== 'undefined'
                )
                .map(({ provider, records, count }) => [
                  provider,
                  typeof records[0] === 'undefined'
                    ? undefined
                    : {
                        ...extractBadgeInfo[provider](records[0]),
                        count,
                        occurrenceCount: undefined,
                      },
                ])
            ),
          })
      );
  }, []);

  React.useEffect(() => {
    if (state.type !== 'MainState') return;

    const occurrenceNames = Object.values(state.aggregatorInfos)
      .filter((aggregatorInfo) => aggregatorInfo)
      .map((aggregatorInfo) => aggregatorInfo?.occurrenceName)
      .filter((occurrenceName) => occurrenceName) as RA<string>;

    if (occurrenceNames.length === 0) return;

    dispatch({
      type: 'SetRemoteOccurrenceNameAction',
      remoteOccurrenceName: IS_DEVELOPMENT
        ? defaultOccurrenceName[1]
        : occurrenceNames[0],
    });
  }, [state.type]);

  React.useEffect(
    () => {
      if (
        state.type !== 'MainState' ||
        typeof state.remoteOccurrenceName === 'undefined'
      )
        return;

      Object.entries(state.aggregatorInfos)
        .filter(
          ([name, data]) =>
            data &&
            data.occurrenceName !== '' &&
            state.badgeStatuses[name]?.isOpen &&
            typeof state.aggregatorInfos.occurrenceCount === 'undefined'
        )
        .forEach(([name]) => {
          void $.get(
            formatOccurrenceCountRequest(name, state.remoteOccurrenceName!)
          ).done((response) =>
            dispatch({
              type: 'OccurrenceCountLoadedAction',
              aggregatorName: name,
              occurrenceCount:
                response.records[0]?.records.map(
                  ({
                    scientificName,
                    occurrence_count: count,
                    occurrence_url: url,
                  }: any) => ({
                    scientificName,
                    count,
                    url,
                  })
                ) ?? [],
            })
          );
        });
    },
    state.type === 'MainState'
      ? [state.remoteOccurrenceName, JSON.stringify(state.badgeStatuses)]
      : [undefined, undefined]
  );

  React.useEffect(
    () => {
      if (
        state.type !== 'MainState' ||
        !state.badgeStatuses.lifemapper?.isOpen ||
        typeof state.remoteOccurrenceName === 'undefined'
      )
        return;

      fetchLocalScientificName(model).then((localScientificName) => {
        const localOccurrenceName = IS_DEVELOPMENT
          ? defaultOccurrenceName[0]
          : localScientificName;

        const getOccurrenceName = (index: 0 | 1): string =>
          extractElement(
            [localOccurrenceName, state.remoteOccurrenceName],
            index
          );

        const similarCoMarkersPromise = new Promise<RA<MarkerGroups>>(
          (resolve) => {
            const similarCollectionObjects = new (
              schema as any
            ).models.CollectionObject.LazyCollection({
              filters: {
                determinations__iscurrent: true,
                determinations__preferredtaxon__fullname: getOccurrenceName(0),
              },
            });

            similarCollectionObjects
              .fetch({
                limit: 350,
              })
              .done(async () =>
                Promise.all<MarkerGroups>(
                  similarCollectionObjects.map(
                    async (collectionObject: any) =>
                      new Promise<MarkerGroups>((resolve) =>
                        collectionObject
                          .rget('collectingevent.locality')
                          .done(async (localityResource: any) =>
                            getLocalityDataFromLocalityResource(
                              localityResource
                            )
                              .then((localityData) =>
                                Leaflet.getMarkersFromLocalityData({
                                  localityData: localityData as LocalityData,
                                  iconClass:
                                    model.get('id') ===
                                    collectionObject.get('id')
                                      ? 'lifemapperCurrentCollectionObjectMarker'
                                      : undefined,
                                })
                              )
                              .then(resolve)
                          )
                      )
                  )
                ).then(resolve)
              );
          }
        );

        const messages: RR<MessageTypes, string[]> = {
          errorDetails: [],
          infoSection: [
            `Specify Species Name: ${
              typeof localOccurrenceName === 'undefined'
                ? 'Not found'
                : localOccurrenceName
            }`,
            `Remote occurrence name: ${
              typeof state.remoteOccurrenceName === 'undefined'
                ? 'Not found'
                : state.remoteOccurrenceName
            }`,
          ],
        };

        $.get(formatOccurrenceMapRequest(getOccurrenceName(1))).done(
          async (response: {
            readonly errors: string[];
            readonly records: [
              {
                readonly records: {
                  readonly endpoint: string;
                  readonly modtime: string;
                  readonly layer_name: string;
                  readonly layer_type: LifemapperLayerTypes;
                }[];
              }
            ];
          }) => {
            let layers: RA<any> = [];

            if (response.errors.length > 0)
              messages.errorDetails.push(...response.errors);
            else if (response.records[0]?.records.length === 0)
              messages.errorDetails.push(
                'Projection map for this species was not found'
              );
            else {
              layers = response.records[0].records
                .sort(
                  (
                    { layer_type: layerTypeLeft },
                    { layer_type: layerTypeRight }
                  ) =>
                    layerTypeLeft === layerTypeRight
                      ? 0
                      : layerTypeLeft > layerTypeRight
                      ? 1
                      : -1
                )
                .map((record) => ({
                  ...lifemapperLayerVariations[record.layer_type],
                  tileLayer: {
                    mapUrl: record.endpoint,
                    options: {
                      layers: record.layer_name,
                      service: 'wms',
                      version: '1.0',
                      height: '400',
                      format: 'image/png',
                      request: 'getmap',
                      srs: 'epsg:3857',
                      width: '800',
                      ...lifemapperLayerVariations[record.layer_type],
                    },
                  },
                }));

              const modificationTime = response.records[0].records[0].modtime;
              messages.errorDetails.push(
                `Model Creation date: ${modificationTime}`
              );
            }

            dispatch({
              type: 'MapLoadedAction',
              markers: await similarCoMarkersPromise,
              layers,
              messages,
            });
          }
        );
      });
    },
    state.type === 'MainState'
      ? [state.remoteOccurrenceName, state.badgeStatuses.lifemapper?.isOpen]
      : [undefined, undefined]
  );

  return stateReducer(<></>, {
    ...state,
    params: {
      dispatch,
    },
  });
}

interface Props {
  model: any;
}

interface ComponentProps extends Props {
  readonly guid: string;
}

const View = createBackboneView<Props, Props, ComponentProps>({
  moduleName: 'LifemapperInfo',
  className: 'lifemapper-info',
  initialize(self, { model }) {
    self.model = model;
  },
  renderPre(self) {
    self.el.style.display = '';
  },
  remove(self) {
    self.el.style.display = 'none';
  },
  Component: LifemapperInfo,
  getComponentProps: (self) => ({
    model: self.model,
    guid: IS_DEVELOPMENT ? defaultGuid : self.model.get('guid'),
  }),
});

export default function register(): void {
  ResourceView.on('rendered', (resourceView: any) => {
    if (resourceView.model.specifyModel.name === 'CollectionObject')
      // @ts-expect-error
      new View({
        model: resourceView.model,
        el: $(
          '<span class="lifemapper-info" style="display:none;"></span>'
        ).appendTo(resourceView.header),
      }).render();
  });
}
