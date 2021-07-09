import type L from 'leaflet';
import React from 'react';

import * as Leaflet from '../leaflet';
import type { MessageTypes } from '../lifemapperconfig';
import { lifemapperMessagesMeta } from '../lifemapperconfig';
import type { Lifemapper } from '../lifemapperreducer';
import { formatIconRequest } from '../lifemapperutills';
import lifemapperText from '../localization/lifemapper';
import type { MainState } from './lifemapperstate';
import type { RA } from './wbplanview';

export function Badge<IS_ENABLED extends boolean>({
  name,
  title,
  onClick: handleClick,
  isEnabled,
  hasError,
}: {
  readonly name: string;
  readonly title: string;
  readonly onClick: IS_ENABLED extends true ? () => void : undefined;
  readonly isEnabled: IS_ENABLED;
  readonly hasError: boolean;
}): JSX.Element {
  return (
    <button
      type="button"
      disabled={!isEnabled}
      onClick={isEnabled ? handleClick : undefined}
      className={`lifemapper-source-icon ${
        isEnabled ? '' : 'lifemapper-source-icon-not-found'
      } ${hasError ? 'lifemapper-source-icon-issues-detected' : ''}`}
      title={title}
    >
      <img
        className="lifemapper-source-icon-active"
        src={formatIconRequest(name, 'active')}
        alt=""
      />
      <img
        className="lifemapper-source-icon-inactive"
        src={formatIconRequest(name, 'inactive')}
        alt=""
      />
      <img
        className="lifemapper-source-icon-hover"
        src={formatIconRequest(name, 'hover')}
        alt=""
      />
    </button>
  );
}

export function Aggregator({
  data,
}: {
  readonly data: MainState['aggregators'][string];
}): JSX.Element {
  return (
    <>
      {Object.keys(data.issues).length === 0 ? (
        <p>{lifemapperText('noIssuesDetected')}</p>
      ) : (
        <>
          <h2>{lifemapperText('issuesDetected')}</h2>
          <ul className="lifemapper-source-issues-list">
            {Object.entries(data.issues).map(([issueKey, issueLabel]) => (
              <li key={issueKey} title={issueKey}>
                {issueLabel}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export function LifemapperMap({
  lifemapper,
}: {
  readonly lifemapper: Lifemapper;
}): JSX.Element | null {
  const mapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!mapRef.current) return undefined;

    let destructorCalled = false;
    function destructor(map: L.Map): void {
      map.off();
      map.remove();
    }
    let leafletMap: L.Map | undefined;
    Leaflet.showCOMap(
      mapRef.current,
      lifemapper.layers,
      (Object.entries(lifemapper.messages) as [MessageTypes, RA<string>][])
        .filter(([, messages]) => messages.length > 0)
        .map(
          ([name, messages]) => `<span
        class="lifemapper-message-section ${
          lifemapperMessagesMeta[name].className
        }"
      >
        <h3>${lifemapperMessagesMeta[name].title}</h3>
        ${messages.join('<br>')}
      </span>`
        )
        .join('')
    )
      .then(([map, layerGroup]) => {
        Leaflet.addMarkersToMap(
          map,
          layerGroup,
          lifemapper.markers.flat(),
          lifemapperText('localOccurrencePoints')
        );
        if (destructorCalled) destructor(map);
        else leafletMap = map;
      })
      .catch((error) => {
        throw error;
      });

    return (): void => {
      if (typeof leafletMap === 'undefined') {
        destructorCalled = true;
      } else destructor(leafletMap);
    };
  }, [mapRef]);

  return <div className="lifemapper-leaflet-map" ref={mapRef} />;
}
