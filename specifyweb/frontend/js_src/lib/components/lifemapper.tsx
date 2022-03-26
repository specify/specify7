import React from 'react';
import type { Action, State } from 'typesafe-reducer';
import { generateDispatch } from 'typesafe-reducer';

import type { CollectionObject, Taxon } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { leafletTileServersPromise } from '../leaflet';
import type { LocalityData } from '../leafletutils';
import type { SpecifyResource } from '../legacytypes';
import { snServer } from '../lifemapperconfig';
import type { OccurrenceData } from '../lifemappermap';
import { fetchLocalOccurrences } from '../lifemappermap';
import {
  fetchOccurrenceName,
  formatLifemapperViewPageRequest,
} from '../lifemapperutills';
import commonText from '../localization/common';
import lifemapperText from '../localization/lifemapper';
import { getBoolPref } from '../remoteprefs';
import { toTable } from '../specifymodel';
import { getSystemInfo } from '../systeminfo';
import type { IR, RA, RR } from '../types';
import { Link } from './basic';
import { ErrorBoundary } from './errorboundary';
import { useBooleanState } from './hooks';
import { Dialog } from './modaldialog';
import { f } from '../functools';

type LoadedAction = Action<'LoadedAction', { version: string }>;

type GetPinInfoAction = Action<'GetPinInfoAction', { index: number }>;

type IncomingMessage = LoadedAction | GetPinInfoAction;

type IncomingMessageExtended = IncomingMessage & {
  state: {
    readonly sendMessage: (message: OutgoingMessage) => void;
    readonly model: SpecifyResource<CollectionObject> | SpecifyResource<Taxon>;
    readonly occurrences: React.MutableRefObject<
      RA<OccurrenceData> | undefined
    >;
  };
};

const dispatch = generateDispatch<IncomingMessageExtended>({
  LoadedAction: ({ state: { sendMessage, model, occurrences } }) =>
    void leafletTileServersPromise
      .then(async (leafletLayers) =>
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
      .then(async () => fetchLocalOccurrences(model))
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
    systemInfo: IR<unknown>;
    leafletLayers: RR<
      'baseMaps' | 'overlays',
      IR<{
        endpoint: string;
        serverType: 'tileServer' | 'wms';
        layerOptions: IR<unknown>;
      }>
    >;
  }
>;

type LocalOccurrencesAction = State<
  'LocalOccurrencesAction',
  {
    occurrences: RA<Omit<OccurrenceData, 'fetchMoreData'>>;
  }
>;

type PointDataAction = State<
  'PointDataAction',
  {
    index: number;
    localityData: LocalityData;
  }
>;

type OutgoingMessage =
  | BasicInformationAction
  | LocalOccurrencesAction
  | PointDataAction;

export const displaySpecifyNetwork = (
  resource: SpecifyResource<AnySchema>
): resource is SpecifyResource<CollectionObject> | SpecifyResource<Taxon> =>
  !getBoolPref('s2n.badges.disable', false) &&
  !resource.isNew() &&
  ['Taxon', 'CollectionObject'].includes(resource.specifyModel.name);

function SpecifyNetwork({
  resource,
}: {
  readonly resource: SpecifyResource<CollectionObject> | SpecifyResource<Taxon>;
}): JSX.Element {
  const [occurrenceName, setOccurrenceName] = React.useState('');
  const [hasFailure, handleFailure, handleNoFailure] = useBooleanState();
  const occurrences = React.useRef<RA<OccurrenceData> | undefined>(undefined);

  React.useEffect(
    () =>
      void f
        .maybe(toTable(resource, 'CollectionObject'), fetchOccurrenceName)
        ?.then(setOccurrenceName)
        .catch(console.error),
    [resource]
  );

  const messageHandler = React.useCallback(
    (event: MessageEvent<IncomingMessage>): void => {
      if (event.origin !== snServer || typeof event.data?.type !== 'string')
        return;
      const action = event.data;
      dispatch({
        ...action,
        state: {
          sendMessage: (message: OutgoingMessage) =>
            (event.source as Window | null)?.postMessage(message, snServer),
          model: resource,
          occurrences,
        },
      });
    },
    [resource]
  );

  return (
    <>
      <Dialog
        isOpen={hasFailure}
        title={lifemapperText('failedToOpenPopUpDialogTitle')}
        header={lifemapperText('failedToOpenPopUpDialogHeader')}
        onClose={handleNoFailure}
        buttons={commonText('close')}
      >
        {lifemapperText('failedToOpenPopUpDialogMessage')}
      </Dialog>
      <Link.Default
        href={formatLifemapperViewPageRequest(
          toTable(resource, 'CollectionObject')?.get('guid') ?? '',
          occurrenceName
        )}
        target="_blank"
        title={lifemapperText('specifyNetwork')}
        aria-label={lifemapperText('specifyNetwork')}
        rel="opener noreferrer"
        className="h-7 rounded-full"
        onClick={(event): void => {
          event.preventDefault();
          const link = (event.target as HTMLElement).closest('a')?.href;
          if (!link) throw new Error('Failed to extract S^N Link');
          const childWindow = window.open(link, '_blank') ?? undefined;
          if (!childWindow) {
            handleFailure();
            return;
          }
          window.removeEventListener('message', messageHandler);
          window.addEventListener('message', messageHandler);
        }}
      >
        <img src="/static/img/specify_network_logo_long.svg" alt="" />
      </Link.Default>
    </>
  );
}

export function SpecifyNetworkBadge({
  resource,
}: {
  readonly resource: SpecifyResource<CollectionObject> | SpecifyResource<Taxon>;
}): JSX.Element {
  return (
    <ErrorBoundary silentErrors={true}>
      <SpecifyNetwork resource={resource} />
    </ErrorBoundary>
  );
}
