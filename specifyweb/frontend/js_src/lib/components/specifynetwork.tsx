/**
 * Display a Specify Network page and handle communication back and force
 * though cross-tab communication (window message passing)
 */

import React from 'react';
import type { Action, State } from 'typesafe-reducer';
import { generateDispatch } from 'typesafe-reducer';

import type { CollectionObject, Taxon } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import { leafletTileServersPromise } from '../leaflet';
import type { LocalityData } from '../leafletutils';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { specifyNetworkText } from '../localization/specifynetwork';
import { hasPermission, hasTablePermission } from '../permissions';
import { getUserPref } from '../preferencesutils';
import { toTable } from '../specifymodel';
import type { OccurrenceData } from '../specifynetworkmap';
import { fetchLocalOccurrences } from '../specifynetworkmap';
import {
  fetchOccurrenceName,
  formatLifemapperViewPageRequest,
  snServer,
} from '../specifynetworkutils';
import { getSystemInfo } from '../systeminfo';
import type { IR, RA, RR } from '../types';
import { Link } from './basic';
import { ErrorBoundary } from './errorboundary';
import { useBooleanState } from './hooks';
import { Dialog, LoadingScreen } from './modaldialog';

type LoadedAction = Action<'LoadedAction', { version: string }>;

type GetPinInfoAction = Action<'GetPinInfoAction', { index: number }>;

type IncomingMessage = LoadedAction | GetPinInfoAction;

type IncomingMessageExtended = IncomingMessage & {
  state: {
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
    void leafletTileServersPromise
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
  resource: SpecifyResource<AnySchema> | undefined
): resource is SpecifyResource<CollectionObject> | SpecifyResource<Taxon> =>
  getUserPref('form', 'ui', 'specifyNetworkBadge') &&
  hasTablePermission('Locality', 'read') &&
  hasPermission('/querybuilder/query', 'execute') &&
  resource?.isNew() === false &&
  ['Taxon', 'CollectionObject'].includes(resource.specifyModel.name);

function SpecifyNetwork({
  resource,
}: {
  readonly resource: SpecifyResource<CollectionObject> | SpecifyResource<Taxon>;
}): JSX.Element {
  const [occurrenceName, setOccurrenceName] = React.useState<
    string | undefined
  >(undefined);
  const [hasFailure, handleFailure, handleNoFailure] = useBooleanState();
  const occurrences = React.useRef<RA<OccurrenceData> | undefined>(undefined);

  React.useEffect(
    () =>
      void (
        f.maybe(toTable(resource, 'Taxon'), async (resource) =>
          resource
            .fetch()
            .then((resource) => resource.get('fullName') ?? undefined)
        ) ?? f.maybe(toTable(resource, 'CollectionObject'), fetchOccurrenceName)
      )
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
          resource,
          occurrences,
        },
      });
    },
    [resource]
  );

  const getLink = React.useCallback(
    (): string =>
      formatLifemapperViewPageRequest(
        toTable(resource, 'CollectionObject')?.get('guid') ?? '',
        occurrenceName ?? ''
      ),
    [resource, occurrenceName]
  );

  const handleClick = React.useCallback((): void => {
    const childWindow = globalThis.open(getLink(), '_blank') ?? undefined;
    if (!childWindow) {
      handleFailure();
      return;
    }
    /*
     * Note: this does not remove the previous event handler so that
     * the Specify Network page can retrieve information even after the form
     * is closed, for as long as the browser tab is open
     */
    globalThis.addEventListener('message', messageHandler);
  }, [getLink, messageHandler, handleFailure]);

  // If link was clicked before resource was fully loaded, show loading message
  const [isPending, handlePending, handleNotPending] = useBooleanState();
  React.useEffect(() => {
    if (isPending && typeof occurrenceName === 'string') {
      handleNotPending();
      handleClick();
    }
  }, [isPending, handleNotPending, handleClick, occurrenceName]);

  return (
    <>
      {isPending && <LoadingScreen />}
      {hasFailure && (
        <Dialog
          header={specifyNetworkText('failedToOpenPopUpDialogHeader')}
          onClose={handleNoFailure}
          buttons={commonText('close')}
        >
          {specifyNetworkText('failedToOpenPopUpDialogText')}
        </Dialog>
      )}
      <Link.Default
        href={getLink()}
        target="_blank"
        title={specifyNetworkText('specifyNetwork')}
        aria-label={specifyNetworkText('specifyNetwork')}
        rel="opener noreferrer"
        onClick={(event): void => {
          event.preventDefault();
          if (occurrenceName === undefined) handlePending();
          else handleClick();
        }}
      >
        <img
          src="/static/img/specify_network_logo_long.svg"
          alt=""
          className="h-7"
        />
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
