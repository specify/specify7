import '../../css/lifemapperinfo.css';

import $ from 'jquery';
import React from 'react';

import type { MarkerGroups } from '../leaflet';
import * as Leaflet from '../leaflet';
import type { LocalityData } from '../leafletutils';
import { reducer } from '../lifemapperinforeducer';
import type { LifemapperLayerTypes } from '../lifemapperinfoutills';
import {
  extractElement,
  fetchLocalScientificName,
  formatOccurrenceCountRequest,
  formatOccurrenceDataRequest,
  formatOccurrenceMapRequest,
  lifemapperLayerVariations,
  sourceLabels,
} from '../lifemapperinfoutills';
import { getLocalityDataFromLocalityResource } from '../localityrecorddataextractor';
import lifemapperText from '../localization/lifemapper';
import remotePrefs from '../remoteprefs';
import ResourceView from '../resourceview';
import schema from '../schema';
import { stateReducer } from './lifemapperinfostate';
import createBackboneView from './reactbackboneextend';
import type { IR, RA, RR } from './wbplanview';
import type { LoadingState } from './wbplanviewstatereducer';

// TODO: remove this
const IS_DEVELOPMENT = false;
const defaultGuid = '2c1becd5-e641-4e83-b3f5-76a55206539a';
/*
 * Const defaultGuid = 'dcb298f9-1ed3-11e3-bfac-90b11c41863e';
 * Const defaultGuid = '8eb23b1e-582e-4943-9dd9-e3a36ceeb498';
 */
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
    title: lifemapperText('leafletDetailsErrorsTitle'),
  },
  infoSection: {
    className: 'info-section',
    title: lifemapperText('leafletDetailsInfoTitle'),
  },
} as const;

type S2NRecord = {
  readonly 's2n:issues'?: IR<string>;
  readonly 'dwc:scientificName': string;
  readonly 's2n:view_url': string;
};

function LifemapperInfo({ model, guid }: ComponentProps): JSX.Element {
  const [state, dispatch] = React.useReducer(reducer, {
    type: 'LoadingState',
  } as LoadingState);

  // Fetch occurrence data
  React.useEffect(() => {
    if (typeof guid === 'undefined') return;

    fetch(formatOccurrenceDataRequest(guid), {
      mode: 'cors',
    })
      .then(async (response) => response.json())
      .then(
        (response: {
          readonly records: {
            readonly provider: string;
            readonly count: number;
            readonly records: [] | [S2NRecord];
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
                        count,
                        occurrenceCount: undefined,
                        issues: records[0]['s2n:issues'] ?? {},
                        occurrenceName: records[0]['dwc:scientificName'],
                        occurrenceViewLink: records[0]['s2n:view_url'],
                      },
                ])
            ),
          })
      );
  }, []);

  // Set remoteOccurrenceName
  React.useEffect(() => {
    if (state.type !== 'MainState') return;

    const occurrenceNames =
      Object.values(state.aggregatorInfos)
        .filter((aggregatorInfo) => aggregatorInfo)
        .map((aggregatorInfo) => aggregatorInfo?.occurrenceName)
        .find((occurrenceName) => occurrenceName)?.[0] ?? '';

    dispatch({
      type: 'SetRemoteOccurrenceNameAction',
      remoteOccurrenceName: IS_DEVELOPMENT
        ? defaultOccurrenceName[1]
        : occurrenceNames,
    });
  }, [state.type]);

  // Set localOccurrenceName
  React.useEffect(() => {
    if (state.type !== 'MainState') return;
    fetchLocalScientificName(model).then((localOccurrenceName) =>
      dispatch({
        type: 'SetLocalOccurrenceNameAction',
        localOccurrenceName,
      })
    );
  }, [state.type]);

  // Fetch occurrence count on dialog open if not yet fetched
  React.useEffect(
    () => {
      if (state.type !== 'MainState') return;
      if (typeof state.remoteOccurrenceName === 'undefined') return;
      let occurrenceName = state.remoteOccurrenceName;
      if (state.remoteOccurrenceName === '') {
        if (!state.localOccurrenceName) return;
        occurrenceName = state.localOccurrenceName;
      }

      Object.entries(state.aggregatorInfos)
        .filter(
          ([name, data]) =>
            data &&
            data.occurrenceName !== '' &&
            state.badgeStatuses[name]?.isOpen &&
            typeof state.aggregatorInfos.occurrenceCount === 'undefined'
        )
        .forEach(([name]) => {
          void $.get(formatOccurrenceCountRequest(name, occurrenceName)).done(
            (response) =>
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
      ? [
          state.localOccurrenceName,
          state.remoteOccurrenceName,
          JSON.stringify(state.badgeStatuses),
        ]
      : [undefined, undefined, undefined]
  );

  /*
   * Fetch related CO records
   * Fetch projection map
   */
  React.useEffect(
    () => {
      if (
        state.type !== 'MainState' ||
        !state.badgeStatuses.lifemapper?.isOpen ||
        typeof state.remoteOccurrenceName === 'undefined' ||
        typeof state.localOccurrenceName === 'undefined'
      )
        return;

      const getOccurrenceName = (index: 0 | 1): string =>
        extractElement(
          [state.localOccurrenceName, state.remoteOccurrenceName],
          index
        );
      if (!getOccurrenceName(1)) return;

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

          const fetchedPopUps: number[] = [];

          similarCollectionObjects
            .fetch({
              limit: 350,
            })
            .done(async () =>
              Promise.all<MarkerGroups | undefined>(
                similarCollectionObjects.map(
                  async (collectionObject: any, index: number) =>
                    new Promise<MarkerGroups | undefined>((resolve) =>
                      collectionObject
                        .rget('collectingevent.locality')
                        .done(async (localityResource: any) =>
                          getLocalityDataFromLocalityResource(
                            localityResource,
                            true
                          )
                            .then((localityData) =>
                              localityData === false
                                ? undefined
                                : Leaflet.getMarkersFromLocalityData({
                                    localityData: localityData as LocalityData,
                                    iconClass:
                                      model.get('id') ===
                                      collectionObject.get('id')
                                        ? 'lifemapper-current-collection-object-marker'
                                        : undefined,
                                    markerClickCallback: ({
                                      target: marker,
                                    }) => {
                                      if (fetchedPopUps.includes(index)) return;
                                      void getLocalityDataFromLocalityResource(
                                        localityResource
                                      ).then((localityData) =>
                                        localityData === false
                                          ? undefined
                                          : marker
                                              .getPopup()
                                              .setContent(
                                                Leaflet.formatLocalityData(
                                                  localityData
                                                )
                                              )
                                      );
                                      fetchedPopUps.push(index);
                                    },
                                  })
                            )
                            .then(resolve)
                        )
                    )
                )
              )
                .then((results) =>
                  results.filter(
                    (result): result is MarkerGroups =>
                      typeof result !== 'undefined'
                  )
                )
                .then(resolve)
            );
        }
      );

      const messages: RR<MessageTypes, string[]> = {
        errorDetails: [],
        infoSection: [
          `${lifemapperText('speciesName')} ${getOccurrenceName(1)}`,
        ],
      };

      $.get(formatOccurrenceMapRequest(getOccurrenceName(1))).done(
        async (response: {
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
        }) => {
          let layers: RA<any> = [];

          if (response.errors.length > 0)
            messages.errorDetails.push(...response.errors);
          else if (response.records[0]?.records.length === 0)
            messages.errorDetails.push(lifemapperText('projectionNotFound'));
          else {
            layers = response.records[0].records
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
              .map((record) => ({
                ...lifemapperLayerVariations[record['s2n:layer_type']],
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
              }));

            const modificationTime =
              response.records[0].records[0]['s2n:modtime'];
            messages.infoSection.push(
              `${lifemapperText('modelCreationData')} ${modificationTime}`
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
    },
    state.type === 'MainState'
      ? [
          state.localOccurrenceName,
          state.remoteOccurrenceName,
          state.badgeStatuses.lifemapper?.isOpen,
        ]
      : [undefined, undefined, undefined]
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
  silentErrors: true,
  Component: LifemapperInfo,
  getComponentProps: (self) => ({
    model: self.model,
    guid: IS_DEVELOPMENT ? defaultGuid : self.model.get('guid'),
  }),
});

export default function register(): void {
  ResourceView.on('rendered', (resourceView: any) => {
    if (
      resourceView.model.specifyModel.name === 'CollectionObject' &&
      // @ts-expect-error
      remotePrefs['s2n.badges.disable'] !== 'true'
    )
      // @ts-expect-error
      new View({
        model: resourceView.model,
        el: $(
          '<span class="lifemapper-info" style="display:none;"></span>'
        ).appendTo(resourceView.header),
      }).render();
  });
}
