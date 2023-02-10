/**
 * Display a Specify Network page and handle communication back and force
 * though cross-tab communication (window message passing)
 */

import React from 'react';
import type { Action, State } from 'typesafe-reducer';
import { generateDispatch } from 'typesafe-reducer';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import { f } from '../../utils/functools';
import type { IR, RA, RR } from '../../utils/types';
import { Link } from '../Atoms/Link';
import { toTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { CollectionObject, Taxon } from '../DataModel/types';
import { getSystemInfo } from '../InitialContext/systemInfo';
import type { LocalityData } from '../Leaflet/helpers';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import type { OccurrenceData } from './map';
import { fetchLocalOccurrences } from './map';
import {
  fetchOccurrenceName,
  formatLifemapperViewPageRequest,
  snServer,
} from './fetch';
import { userPreferences } from '../Preferences/userPreferences';
import { leafletLayersPromise } from '../Leaflet/layers';
import { Dialog, LoadingScreen } from '../Molecules/Dialog';
import { softFail } from '../Errors/Crash';
import { ErrorBoundary } from '../Errors/ErrorBoundary';

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

export const displaySpecifyNetwork = (
  resource: SpecifyResource<AnySchema> | undefined
): resource is SpecifyResource<CollectionObject> | SpecifyResource<Taxon> =>
  userPreferences.get('form', 'ui', 'specifyNetworkBadge') &&
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
        .catch(softFail),
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
    globalThis.window.addEventListener('message', messageHandler);
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
          buttons={commonText.close()}
          header={specifyNetworkText.failedToOpenPopUp()}
          onClose={handleNoFailure}
        >
          {specifyNetworkText.failedToOpenPopUpDescription()}
        </Dialog>
      )}
      <Link.Default
        aria-label={`${specifyNetworkText.specifyNetwork()} ${commonText.opensInNewTab()}`}
        href={getLink()}
        rel="opener noreferrer"
        target="_blank"
        title={`${specifyNetworkText.specifyNetwork()} ${commonText.opensInNewTab()}`}
        onClick={(event): void => {
          event.preventDefault();
          if (occurrenceName === undefined) handlePending();
          else handleClick();
        }}
      >
        <img
          alt=""
          className="h-7"
          src="/static/img/specify_network_logo_long.svg"
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
    <ErrorBoundary silentErrors>
      <SpecifyNetwork resource={resource} />
    </ErrorBoundary>
  );
}
