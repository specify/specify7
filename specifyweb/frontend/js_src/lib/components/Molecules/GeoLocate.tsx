import React from 'react';

import { useCachedState } from '../../hooks/useCachedState';
import { localityText } from '../../localization/locality';
import type { IR } from '../../utils/types';
import { formatUrl } from '../Router/queryString';
import { Dialog } from './Dialog';

export type GeoLocatePayload = {
  readonly latitude: string;
  readonly longitude: string;
  readonly uncertainty: string;
  readonly polygon: string;
};

const defaultWidth = 947;
const defaultHeight = 779;
const baseData = {
  v: '1',
  w: '900',
  h: '400',
  georef: 'run',
};

export function GenericGeoLocate({
  data,
  onClose: handleClose,
  onUpdate: handleUpdate,
  buttons,
}: {
  readonly data: IR<string>;
  readonly onClose: () => void;
  readonly onUpdate: ((payload: GeoLocatePayload) => void) | undefined;
  readonly buttons: JSX.Element;
}): JSX.Element {
  const [width = defaultWidth, setWidth] = useCachedState('geoLocate', 'width');
  const [height = defaultHeight, setHeight] = useCachedState(
    'geoLocate',
    'height'
  );

  React.useEffect(() => {
    if (handleUpdate === undefined) return;

    function listener(event: MessageEvent): void {
      if (
        !event.origin.endsWith('www.geo-locate.org') ||
        typeof event.data !== 'string' ||
        event.data === '|||'
      )
        return;

      const [latitude, longitude, uncertainty, polygon] = event.data.split('|');
      handleUpdate?.({ latitude, longitude, uncertainty, polygon });
    }

    globalThis.window.addEventListener('message', listener);
    return (): void => globalThis.removeEventListener('message', listener);
  }, [handleUpdate]);

  // GEOLocate doesn't like '|' to be uri escaped.
  const url = React.useMemo(
    () =>
      formatUrl('https://www.geo-locate.org/web/webgeoreflight.aspx', {
        ...baseData,
        ...data,
      }).replace(/%7c/giu, '|'),
    [data]
  );

  return (
    <Dialog
      buttons={buttons}
      forwardRef={{
        container(container): void {
          if (container === null) return;
          container.style.width = `${width}px`;
          container.style.height = `${height}px`;
        },
      }}
      header={localityText('geoLocate')}
      modal={false}
      onClose={handleClose}
      // REFACTOR: consider adding a hook to remember dialog size and position
      onResize={(container): void => {
        setWidth(container.clientWidth);
        setHeight(container.clientHeight);
      }}
    >
      <iframe className="h-full" src={url} title={localityText('geoLocate')} />
    </Dialog>
  );
}
