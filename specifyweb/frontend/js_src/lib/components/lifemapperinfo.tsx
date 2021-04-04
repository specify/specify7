'use strict';

import $ from 'jquery';
import React from 'react';
import '../../css/lifemapperinfo.css';
import * as Leaflet from '../leaflet';
import { reducer } from '../lifemapperinforeducer';
import {
  extractBadgeInfo,
  extractEl,
  fetchLocalScientificName,
  formatOccurrenceCountRequest,
  formatOccurrenceDataRequest,
  formatOccurrenceMapRequest,
  lifemapperLayerVariations,
  sourceLabels,
} from '../lifemapperinfoutills';
import ResourceView from '../resourceview';
import schema from '../schema';
import { stateReducer } from './lifemapperinfostate';
import createBackboneView from './reactbackboneextend';
import { R } from './wbplanview';
import { LoadingState } from './wbplanviewstatereducer';

// TODO: remove this
const IS_DEVELOPMENT = false;
const defaultGuid = 'fa7dd78f-8c91-49f5-b01c-f61b3d30caee';
// const defaultGuid = '8eb23b1e-582e-4943-9dd9-e3a36ceeb498';
const defaultOccurrenceName: Readonly<[string, string]> = [
  'Phlox longifolia Nutt.',
  'Phlox longifolia Nutt.',
] as const;


export type MessageTypes = 'errorDetails' | 'infoSection';

export const lifemapperMessagesMeta: Record<MessageTypes, {
  className: string,
  title: string,
}> = {
  'errorDetails': {
    className: 'error-details',
    title: 'The following errors were reported by Lifemapper:',
  },
  'infoSection': {
    className: 'info-section',
    title: 'Projection Details:',
  },
} as const;

function LifemapperInfo({
  model,
  guid,
}: {
  model: any,
  guid: string | undefined
}) {

  const [state, dispatch] = React.useReducer(
    reducer,
    {
      type: 'LoadingState',
    } as LoadingState,
  );

  React.useEffect(() => {

    if (typeof guid === 'undefined')
      return;

    $.get(
      formatOccurrenceDataRequest(guid),
    ).done((response: {
        records: {
          provider: string,
          count: number,
          records: [] | [R<unknown>]
        }[]
      }) =>
        dispatch({
          type: 'LoadedAction',
          aggregatorInfos: Object.fromEntries(
            (
              response.records || []
            ).map((record) => (
              {
                ...record,
                provider: record.provider.toLowerCase(),
              }
            )).filter((record) =>
              typeof sourceLabels[record.provider] !== 'undefined',
            ).map(({provider, records, count}) => [
              provider,
              typeof records[0] === 'undefined' ?
                undefined :
                {
                  ...extractBadgeInfo[provider](records[0]),
                  count,
                  occurrenceCount: undefined,
                },
            ]),
          ),
        }),
    );

  }, []);

  React.useEffect(() => {
    if (state.type !== 'MainState')
      return;

    const occurrenceNames = Object.values(
      state.aggregatorInfos,
    ).filter(aggregatorInfo =>
      aggregatorInfo,
    ).map(aggregatorInfo =>
      aggregatorInfo?.occurrenceName,
    ).filter(occurrenceName =>
      occurrenceName,
    ) as string[];

    if (occurrenceNames.length === 0)
      return;

    dispatch({
      type: 'SetRemoteOccurrenceNameAction',
      remoteOccurrenceName: IS_DEVELOPMENT ?
        defaultOccurrenceName[1] :
        occurrenceNames[0],
    });

  }, [state.type]);

  React.useEffect(() => {

      if (
        state.type !== 'MainState' ||
        typeof state.remoteOccurrenceName === 'undefined'
      )
        return;

      Object.entries(state.aggregatorInfos).filter(([name, data]) =>
        data &&
        data.occurrenceName !== '' &&
        state.badgeStatuses[name]?.isOpen &&
        typeof state.aggregatorInfos.occurrenceCount === 'undefined',
      ).forEach(([name]) => {
        void $.get(formatOccurrenceCountRequest(
          name,
          state.remoteOccurrenceName!,
        )).done(response =>
          dispatch({
            type: 'OccurrenceCountLoadedAction',
            aggregatorName: name,
            occurrenceCount: response.records.map(({
              scientificName,
              occurrence_count,
              occurrence_url,
            }: any) => (
              {
                scientificName,
                count: occurrence_count,
                url: occurrence_url,
              }
            )),
          }),
        );
      });

    }, state.type === 'MainState' ?
    [
      state.remoteOccurrenceName,
      JSON.stringify(state.badgeStatuses),
    ] :
    [
      undefined,
      undefined,
    ],
  );

  React.useEffect(() => {

      if (
        state.type !== 'MainState' ||
        !state.badgeStatuses['lifemapper']?.isOpen ||
        typeof state.remoteOccurrenceName === 'undefined'
      )
        return;


      fetchLocalScientificName(model).then((localScientificName) => {
        const localOccurrenceName = IS_DEVELOPMENT ?
          defaultOccurrenceName[0] :
          localScientificName;

        const getOccurrenceName = (index: 0 | 1) =>
          extractEl([localOccurrenceName, state.remoteOccurrenceName], index);

        const similarCoMarkersPromise = new Promise(resolve => {

          const similarCollectionObjects =
            new (
              schema as any
            ).models.CollectionObject.LazyCollection({
              filters: {
                determinations__iscurrent: true,
                determinations__preferredtaxon__fullname:
                  getOccurrenceName(0),
              },
            });

          similarCollectionObjects.fetch({
            limit: 100,
          }).done(() =>
            Promise.all(
              similarCollectionObjects.map((collectionObject: any) =>
                new Promise(resolve =>
                  collectionObject.rget(
                    'collectingevent.locality',
                  ).done((locality: any) =>
                    Leaflet.getMarkersFromLocalityResource(
                      locality,
                      model.get('id') ===
                      collectionObject.get('id') ?
                        'lifemapperCurrentCollectionObjectMarker' :
                        undefined,
                    ).then(resolve),
                  ),
                ),
              ),
            ).then(resolve),
          );

        });

        const messages: Record<MessageTypes, string[]> = {
          'errorDetails': [],
          'infoSection': [
            `Specify Species Name: ${
              typeof localOccurrenceName === 'undefined' ?
                'Not found' :
                localOccurrenceName
            }`,
            `Remote occurrence name: ${
              typeof state.remoteOccurrenceName === 'undefined' ?
                'Not found' :
                state.remoteOccurrenceName
            }`,
          ],
        };

        $.get(
          formatOccurrenceMapRequest(
            getOccurrenceName(1),
          ),
        ).done(async (response: {
          errors: string[],
          records: [] | [{
            endpoint: string,
            projection_link: string,
            point_name: string,
            modtime: string
          }]
        }) => {

          let layers: any[] = [];

          if (response.errors.length !== 0)
            messages['errorDetails'].push(...response.errors);

          else if (response.records.length === 0)
            messages['errorDetails'].push(
              'Projection map for this species was not found',
            );

          else {

            const {
              endpoint,
              projection_link: projectionLink,
              point_name: mapName,
              modtime: modificationTime,
            } = response.records[0];

            const mapUrl = `${endpoint}/`;
            const mapId = mapName.replace(/\D/g, '');
            const layerId = /\/(\d+)$/.exec(
              projectionLink,
            )![1];
            layers = lifemapperLayerVariations.map(({
                transparent,
                name: layerNameFunction,
                label: layerLabel,
              }) => (
                {
                  transparent,
                  layerLabel,
                  tileLayer: {
                    mapUrl,
                    options: {
                      layers: layerNameFunction(
                        mapId,
                        layerId,
                      ),
                      service: 'wms',
                      version: '1.0',
                      height: '400',
                      format: 'image/png',
                      request: 'getmap',
                      srs: 'epsg:3857',
                      width: '800',
                      transparent: transparent,
                    },
                  },
                }
              ),
            );

            messages.errorDetails.push(
              `Model Creation date: ${modificationTime}`,
            );

          }

          dispatch({
            type: 'MapLoadedAction',
            markers: await similarCoMarkersPromise,
            layers,
            messages,
          });

        });

      });

      return;

    },
    state.type === 'MainState' ?
      [
        state.remoteOccurrenceName,
        state.badgeStatuses['lifemapper']?.isOpen,
      ] :
      [
        undefined,
        undefined,
      ],
  );

  return stateReducer(
    <></>,
    {
      ...state,
      params: {
        dispatch,
      },
    },
  );
}

interface Props {
  model: any,
}

interface ComponentProps extends Props {
  guid: string,
}

const View = createBackboneView<Props, Props, ComponentProps>({
  moduleName: 'LifemapperInfo',
  className: 'lifemapper-info',
  initialize(
    self,
    {model},
  ) {
    self.model = model;
  },
  renderPre(self) {
    self.el.style.display = '';
  },
  remove(self) {
    self.el.style.display = 'none';
  },
  Component: LifemapperInfo,
  getComponentProps: (self) => (
    {
      model: self.model,
      guid: IS_DEVELOPMENT ?
        defaultGuid :
        self.model.get('guid'),
    }
  ),
});

export default function register():void {
  ResourceView.on('rendered', (resourceView: any) => {
    if (resourceView.model.specifyModel.name === 'CollectionObject')
      // @ts-ignore
      new View({
        model: resourceView.model,
        el: $(
          '<span class="lifemapper-info" style="display:none;"></span>',
        ).appendTo(resourceView.header),
      }).render();
  });
}
