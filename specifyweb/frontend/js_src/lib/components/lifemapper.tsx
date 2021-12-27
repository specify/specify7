import '../../css/lifemapper.css';

import React from 'react';
import type { Action, State } from 'typesafe-reducer';
import { generateDispatch } from 'typesafe-reducer';

import ajax from '../ajax';
import { getLeafletLayers } from '../leaflet';
import type { LocalityData } from '../leafletutils';
import { snServer } from '../lifemapperconfig';
import type { OccurrenceData } from '../lifemappermap';
import { fetchLocalOccurrences } from '../lifemappermap';
import {
  fetchOccurrenceName,
  formatLifemapperViewPageRequest,
} from '../lifemapperutills';
import lifemapperText from '../localization/lifemapper';
import { Link } from './basic';
import type { IR, RA, RR } from '../types';
import systemInfo from '../systeminfo';
import type { ComponentProps } from './lifemapperwrapper';
import { closeDialog, ModalDialog } from './modaldialog';
import type { SpecifyResource } from './wbplanview';

type LoadedAction = Action<'LoadedAction', { version: string }>;

type GetPinInfoAction = Action<'GetPinInfoAction', { index: number }>;

type ViewRecordAction = Action<'ViewRecordAction', { index: number }>;

type IncomingMessage = LoadedAction | GetPinInfoAction | ViewRecordAction;

type IncomingMessageExtended = IncomingMessage & {
  state: {
    readonly sendMessage: (message: OutgoingMessage) => void;
    readonly model: SpecifyResource;
    readonly occurrenceData: React.MutableRefObject<
      RA<OccurrenceData> | undefined
    >;
  };
};

const dispatch = generateDispatch<IncomingMessageExtended>({
  LoadedAction: ({ state: { sendMessage, model, occurrenceData } }) =>
    void getLeafletLayers()
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
        occurrenceData.current = fetchedOccurrenceData;
        sendMessage({
          type: 'LocalOccurrencesAction',
          localityData: fetchedOccurrenceData.map(
            ({ localityData }) => localityData
          ),
        });
      }),
  GetPinInfoAction({ index, state: { sendMessage, occurrenceData } }) {
    occurrenceData.current?.[index].fetchMoreData().then((localityData) =>
      typeof localityData === 'object'
        ? sendMessage({
            type: 'PointDataAction',
            index,
            localityData,
          })
        : console.error('Failed to fetch locality data')
    );
  },
  ViewRecordAction({ index, state: { occurrenceData } }) {
    if (!Array.isArray(occurrenceData.current))
      throw new Error('Occurrence data is not fetched');
    window.open(
      `/specify/view/collectionobject/${occurrenceData.current[index].collectionObjectId}/`,
      '_blank'
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
    localityData: RA<LocalityData>;
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
  guid,
  model,
}: ComponentProps): JSX.Element | null {
  const [occurrenceName, setOccurrenceName] = React.useState('');
  const [hasFailure, setHasFailure] = React.useState(false);
  const occurrenceData = React.useRef<RA<OccurrenceData> | undefined>(
    undefined
  );
  const [communicationReference] = React.useState<number>(Math.random());

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
          sendMessage(message: OutgoingMessage) {
            if (typeof event.source === 'undefined')
              throw new Error('S^N: Window is not defined');
            (event.source as Window).postMessage(message, snServer);
          },
          model,
          occurrenceData,
        },
      });
    },
    [model]
  );

  if (!guid) return <></>;

  return (
    <>
      {hasFailure && (
        <ModalDialog
          properties={{
            title: lifemapperText('failedToOpenPopUpDialogTitle'),
            close: () => setHasFailure(false),
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
        </ModalDialog>
      )}
      <a
        href={formatLifemapperViewPageRequest(
          guid,
          occurrenceName,
          communicationReference
        )}
        target="_blank"
        title={lifemapperText('specifyNetwork')}
        aria-label={lifemapperText('specifyNetwork')}
        rel="opener noreferrer"
        className="lifemapper-source-icon"
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
        <img src="/static/img/specify_network_box_only.svg" alt="" />
      </a>
    </>
  );
}
