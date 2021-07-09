import '../../css/lifemapperinfo.css';

import $ from 'jquery';
import React from 'react';

import type { MarkerGroups } from '../leaflet';
import * as Leaflet from '../leaflet';
import { reducer } from '../lifemapperinforeducer';
import type { LifemapperLayerTypes } from '../lifemapperinfoutills';
import {
  extractElement,
  fetchLocalScientificName,
  formatLifemapperViewPageRequest,
  formatOccurrenceDataRequest,
  formatOccurrenceMapRequest,
  lifemapperLayerVariations,
} from '../lifemapperinfoutills';
import {
  formatLocalityDataObject,
  getLocalityDataFromLocalityResource,
  parseLocalityPinFields,
} from '../localityrecorddataextractor';
import lifemapperText from '../localization/lifemapper';
import remotePrefs from '../remoteprefs';
import ResourceView from '../resourceview';
import schema from '../schema';
import { Badge } from './lifemappercomponents';
import { stateReducer } from './lifemapperinfostate';
import createBackboneView from './reactbackboneextend';
import type { IR, RA, RR } from './wbplanview';
import type { LoadingState } from './wbplanviewstatereducer';
import csrftoken from '../csrftoken.js';
import fetchDataModel from '../wbplanviewmodelfetcher';

// TODO: remove this
const IS_DEVELOPMENT = false;
const defaultGuid = [
  '2c1becd5-e641-4e83-b3f5-76a55206539a',
  'dcb298f9-1ed3-11e3-bfac-90b11c41863e',
  '8eb23b1e-582e-4943-9dd9-e3a36ceeb498',
][0];
const defaultOccurrenceName: Readonly<[string, string]> = [
  'Phlox longifolia Nutt.',
  'Phlox longifolia Nutt.',
] as const;

const HTTP_OK = 200;

export const snServer = 'https://broker-dev.spcoco.org';
export const snFrontendServer = 'https://broker.spcoco.org';

export const SN_SERVICES: IR<string> = {
  sn: lifemapperText('specifyNetwork'),
  lm: lifemapperText('lifemapper'),
};
const ignoredAggregators: RA<string> = ['specify'];
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
    title: lifemapperText('leafletDetailsErrorsHeader'),
  },
  infoSection: {
    className: 'info-section',
    title: lifemapperText('leafletDetailsInfoHeader'),
  },
} as const;

type AggregatorResponseBase = {
  readonly provider: {
    readonly code: string;
    readonly label: string;
    readonly status_code: number;
  };
};

type AggregatorResponseWithoutData = AggregatorResponseBase & {
  readonly records: [];
};

type AggregatorResponseWithData = AggregatorResponseBase & {
  readonly records: [
    {
      readonly 's2n:issues'?: IR<string>;
      readonly 'dwc:scientificName': string;
      readonly 's2n:view_url': string;
    }
  ];
};

function LifemapperInfo({
  model,
  guid,
  handleOccurrenceNameFetch,
}: ComponentProps & {
  readonly handleOccurrenceNameFetch: (occurrenceName: string) => void;
}): JSX.Element {
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
          readonly records: (
            | AggregatorResponseWithoutData
            | AggregatorResponseWithData
          )[];
        }) =>
          dispatch({
            type: 'LoadedAction',
            occurrenceData: Object.fromEntries(
              response.records
                .filter(
                  ({ provider }) => !ignoredAggregators.includes(provider.code)
                )
                .map(({ provider, records }) => [
                  provider.code,
                  {
                    badge: {
                      label: provider.label,
                      isOpen: false,
                      isActive:
                        provider.status_code === HTTP_OK &&
                        typeof records[0] !== 'undefined',
                    },
                    aggregator:
                      provider.status_code === HTTP_OK &&
                      typeof records[0] !== 'undefined'
                        ? {
                            issues: records[0]['s2n:issues'] ?? {},
                            occurrenceName: records[0]['dwc:scientificName'],
                            occurrenceViewLink: records[0]['s2n:view_url'],
                          }
                        : undefined,
                  },
                ])
            ),
          })
      );
  }, []);

  // Set remoteOccurrenceName
  React.useEffect(() => {
    if (
      state.type !== 'MainState' ||
      typeof state.localOccurrenceName !== 'undefined'
    )
      return;

    const occurrenceName =
      Object.values(state.aggregators)
        .filter((aggregatorInfo) => aggregatorInfo)
        .map((aggregatorInfo) => aggregatorInfo?.occurrenceName)
        .find((occurrenceName) => occurrenceName) ?? '';

    dispatch({
      type: 'SetRemoteOccurrenceNameAction',
      remoteOccurrenceName: IS_DEVELOPMENT
        ? defaultOccurrenceName[1]
        : occurrenceName,
    });

    handleOccurrenceNameFetch(
      extractElement([state.localOccurrenceName, occurrenceName], 1)
    );
  }, [
    state.type,
    state.type === 'MainState' ? state.localOccurrenceName : undefined,
  ]);

  // Set localOccurrenceName
  React.useEffect(() => {
    if (
      state.type !== 'MainState' ||
      typeof state.localOccurrenceName !== 'undefined'
    )
      return;
    void fetchLocalScientificName(model).then((localOccurrenceName) => {
      dispatch({
        type: 'SetLocalOccurrenceNameAction',
        localOccurrenceName,
      });
      if (typeof state.remoteOccurrenceName === 'undefined')
        handleOccurrenceNameFetch(localOccurrenceName);
    });
  }, [
    state.type,
    state.type === 'MainState' ? state.remoteOccurrenceName : undefined,
    state.type === 'MainState' ? state.localOccurrenceName : undefined,
  ]);

  /*
   * Fetch related CO records
   * Fetch projection map
   */
  React.useEffect(
    () => {
      if (
        state.type !== 'MainState' ||
        !state.badges.lm.isOpen ||
        typeof state.remoteOccurrenceName === 'undefined' ||
        typeof state.localOccurrenceName === 'undefined' ||
        typeof state.lifemapperInfo !== 'undefined'
      )
        return;

      const getOccurrenceName = (index: 0 | 1): string =>
        extractElement(
          [state.localOccurrenceName, state.remoteOccurrenceName],
          index
        );
      if (!getOccurrenceName(1)) return;

      const similarCoMarkersPromise = new Promise<RA<MarkerGroups>>(
        async (resolve) => {
          await fetchDataModel();

          const determination = await model.rget('determinations');

          const currentDetermination = determination.models.filter(
            (model: any) => model.get('iscurrent')
          )[0];

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
              limit: LIMIT,
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

          let currentLocalityId: undefined | number;
          const localities = await Promise.all(
            results.results.map(
              ([collectionObjectId, localityId, ...localityData]) => {
                if (collectionObjectId === model.get('id'))
                  currentLocalityId = localityId;

                return {
                  localityId,
                  localityData: formatLocalityDataObject(
                    parsedLocalityFields.map((mappingPath, index) => [
                      mappingPath,
                      localityData[index],
                    ])
                  ),
                  fetchLocalityResource: () =>
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
              }
            )
          );

          const fetchedPopUps: number[] = [];
          const markers = await Promise.all(
            localities.map(
              ({ localityId, localityData, fetchLocalityResource }, index) =>
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
                            localityResource
                          );
                        if (localityData !== false)
                          marker
                            .getPopup()
                            .setContent(
                              Leaflet.formatLocalityData(localityData)
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
          state.badges.lm.isOpen,
          state.lifemapperInfo,
        ]
      : [undefined, undefined, undefined, undefined]
  );

  return stateReducer(<></>, {
    ...state,
    params: {
      dispatch,
      guid,
    },
  });
}

interface Props {
  model: any;
}

interface ComponentProps extends Props {
  readonly guid: string;
}

class ErrorBoundary extends React.Component<
  { readonly children: JSX.Element; readonly hasErrorCallback: () => void },
  { readonly hasError: boolean }
> {
  public state: { readonly hasError: boolean } = {
    hasError: false,
  };

  public componentDidCatch = this.props.hasErrorCallback;

  public render(): JSX.Element | null {
    return this.props.children;
  }
}

// If any error occurs, fallback to displaying a link to the SN page
function LifemapperWrapper(props: ComponentProps): JSX.Element {
  const [hasError, setHasError] = React.useState<boolean>(false);
  const [occurrenceName, setOccurrenceName] = React.useState<
    string | undefined
  >(undefined);

  return hasError ? (
    typeof occurrenceName === 'undefined' ? (
      <></>
    ) : (
      <Badge
        name={'sn'}
        title={SN_SERVICES.sn}
        onClick={(): void =>
          void window.open(
            formatLifemapperViewPageRequest(props.guid, occurrenceName, ''),
            '_blank'
          )
        }
        isEnabled={true}
        hasError={false}
      />
    )
  ) : (
    <ErrorBoundary hasErrorCallback={() => setHasError(true)}>
      <LifemapperInfo
        {...props}
        handleOccurrenceNameFetch={setOccurrenceName}
      />
    </ErrorBoundary>
  );
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
  Component: LifemapperWrapper,
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
