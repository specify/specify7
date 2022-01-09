import React from 'react';
import type { Action, State } from 'typesafe-reducer';
import { generateDispatch } from 'typesafe-reducer';

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
import systemInfo from '../systeminfo';
import type { IR, RA, RR } from '../types';
import { Link } from './basic';
import { closeDialog, JqueryDialog } from './modaldialog';

type LoadedAction = Action<'LoadedAction', { version: string }>;

type GetPinInfoAction = Action<'GetPinInfoAction', { index: number }>;

type IncomingMessage = LoadedAction | GetPinInfoAction;

type IncomingMessageExtended = IncomingMessage & {
  state: {
    readonly sendMessage: (message: OutgoingMessage) => void;
    readonly model: SpecifyResource;
    readonly occurrences: React.MutableRefObject<
      RA<OccurrenceData> | undefined
    >;
  };
};

const dispatch = generateDispatch<IncomingMessageExtended>({
  LoadedAction: ({ state: { sendMessage, model, occurrences } }) =>
    void leafletTileServersPromise
      .then((leafletLayers) =>
        sendMessage({
          type: 'BasicInformationAction',
          systemInfo,
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

export function SpecifyNetworkBadge({
  model,
}: {
  readonly model: SpecifyResource;
}): JSX.Element | null {
  const [occurrenceName, setOccurrenceName] = React.useState('');
  const [hasFailure, setHasFailure] = React.useState(false);
  const occurrences = React.useRef<RA<OccurrenceData> | undefined>(undefined);

  const guid = model.get<string>('guid');

  React.useEffect(() => {
    fetchOccurrenceName({
      guid,
      model,
    })
      .then(setOccurrenceName)
      .catch(console.error);
  }, [guid, model]);

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
          model,
          occurrences,
        },
      });
    },
    [model]
  );

  return (
    <>
      {hasFailure && (
        <JqueryDialog
          properties={{
            title: lifemapperText('failedToOpenPopUpDialogTitle'),
            close: (): void => setHasFailure(false),
            buttons: [
              {
                text: commonText('close'),
                click: closeDialog,
              },
            ],
          }}
        >
          {lifemapperText('failedToOpenPopUpDialogHeader')}
          <p>{lifemapperText('failedToOpenPopUpDialogMessage')}</p>
        </JqueryDialog>
      )}
      <Link
        href={formatLifemapperViewPageRequest(guid ?? '', occurrenceName)}
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
            setHasFailure(true);
            return;
          }
          window.removeEventListener('message', messageHandler);
          window.addEventListener('message', messageHandler);
        }}
      >
        <img src="/static/img/specify_network_logo_long.svg" alt="" />
      </Link>
    </>
  );
}
