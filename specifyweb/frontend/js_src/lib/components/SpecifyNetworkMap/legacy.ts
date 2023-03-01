import type React from 'react';
import type { Action, State } from 'typesafe-reducer';
import { generateDispatch } from 'typesafe-reducer';

import type { IR, RA, RR } from '../../utils/types';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { CollectionObject, Taxon } from '../DataModel/types';
import { getSystemInfo } from '../InitialContext/systemInfo';
import type { LocalityData } from '../Leaflet/helpers';
import { leafletLayersPromise } from '../Leaflet/layers';
import type { OccurrenceData } from './mapData';
import { fetchLocalOccurrences } from './mapData';

// FIXME: get rid of this file
type LoadedAction = Action<'LoadedAction', { readonly version: string }>;

type GetPinInfoAction = Action<'GetPinInfoAction', { readonly index: number }>;

type IncomingMessage = GetPinInfoAction | LoadedAction;

type IncomingMessageExtended = IncomingMessage & {
  readonly state: {
    readonly sendMessage: (message: OutgoingMessage) => void;
    readonly resource:
      | SpecifyResource<CollectionObject>
      | SpecifyResource<Taxon>;
    readonly occurrences: React.MutableRefObject<
      RA<OccurrenceData> | undefined
    >;
  };
};

const dispatch = generateDispatch<IncomingMessageExtended>({
  LoadedAction: ({ state: { sendMessage, resource, occurrences } }) =>
    void leafletLayersPromise
      .then((leafletLayers) =>
        sendMessage({
          type: 'BasicInformationAction',
          systemInfo: getSystemInfo(),
          // @ts-expect-error
          leafletLayers: Object.fromEntries(
            Object.entries(leafletLayers).map(([groupName, group]) => [
              groupName,
              Object.fromEntries(
                Object.entries(group).map(([layerName, layer]) => [
                  layerName,
                  {
                    // @ts-expect-error
                    endpoint: layer._url,
                    serverType: 'wmsParams' in layer ? 'wms' : 'tileServer',
                    layerOptions: layer.options,
                  },
                ])
              ),
            ])
          ),
        })
      )
      .then(async () => fetchLocalOccurrences(resource))
      .then((fetchedOccurrenceData) => {
        occurrences.current = fetchedOccurrenceData;
        sendMessage({
          type: 'LocalOccurrencesAction',
          occurrences: fetchedOccurrenceData.map(
            ({ fetchMoreData: _, ...rest }) => rest
          ),
        });
      }),
  GetPinInfoAction({ index, state: { sendMessage, occurrences } }) {
    occurrences.current?.[index].fetchMoreData().then((localityData) =>
      typeof localityData === 'object'
        ? sendMessage({
            type: 'PointDataAction',
            index,
            localityData,
          })
        : console.error('Failed to fetch locality data')
    );
  },
});

type BasicInformationAction = State<
  'BasicInformationAction',
  {
    readonly systemInfo: IR<unknown>;
    readonly leafletLayers: RR<
      'baseMaps' | 'overlays',
      IR<{
        readonly endpoint: string;
        readonly serverType: 'tileServer' | 'wms';
        readonly layerOptions: IR<unknown>;
      }>
    >;
  }
>;

type LocalOccurrencesAction = State<
  'LocalOccurrencesAction',
  {
    readonly occurrences: RA<Omit<OccurrenceData, 'fetchMoreData'>>;
  }
>;

type PointDataAction = State<
  'PointDataAction',
  {
    readonly index: number;
    readonly localityData: LocalityData;
  }
>;

type OutgoingMessage =
  | BasicInformationAction
  | LocalOccurrencesAction
  | PointDataAction;
