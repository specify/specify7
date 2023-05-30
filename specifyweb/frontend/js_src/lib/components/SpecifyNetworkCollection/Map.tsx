import type L from 'leaflet';
import React from 'react';
import _ from 'underscore';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useTriggerState } from '../../hooks/useTriggerState';
import { ajax } from '../../utils/ajax';
import type { IR } from '../../utils/types';
import { getLayerPaneZindex } from '../Leaflet';
import type { LeafletInstance } from '../Leaflet/addOns';
import { LeafletMap } from '../Leaflet/Map';
import { loadingGif } from '../Molecules';
import { Range } from '../Molecules/Range';
import { formatUrl } from '../Router/queryString';
import { getGbifLayer } from '../SpecifyNetwork/overlays';

const rangeDefaults = [0, new Date().getFullYear()];
const debounceRate = 500;

export function GbifMap({
  mapData,
}: {
  readonly mapData:
    | {
        readonly datasetKey: string;
      }
    | { readonly publishingOrg: string };
}): JSX.Element | null {
  const [yearRange] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<{
          readonly minYear?: number;
          readonly maxYear?: number;
        }>(
          formatUrl(
            'https://api.gbif.org/v2/map/occurrence/density/capabilities.json',
            mapData
          ),
          {
            headers: {
              Accept: 'application/json',
            },
          }
        ).then(
          ({ data }) =>
            [
              data.minYear ?? rangeDefaults[0],
              data.maxYear ?? rangeDefaults[1],
            ] as const
        ),
      [mapData]
    ),
    false
  );

  const [range, setRange] = useTriggerState(yearRange);

  // Throttle year range changes
  const [throttledRange, setThrottledRange] = React.useState(range);
  const handleChange = React.useMemo(
    () => _.debounce(setThrottledRange, debounceRate),
    []
  );
  React.useEffect(() => handleChange(range), [range, handleChange]);

  return yearRange === undefined || range === undefined ? (
    loadingGif
  ) : (
    <>
      <Range range={yearRange} value={[range, setRange]} />
      {typeof throttledRange === 'object' && (
        <MapWrapper mapData={mapData} range={throttledRange} />
      )}
    </>
  );
}

function MapWrapper({
  range,
  mapData,
}: {
  readonly range: readonly [number, number];
  readonly mapData: IR<string>;
}): JSX.Element {
  const [map, setMap] = React.useState<LeafletInstance | undefined>(undefined);
  const overlay = React.useRef<L.Layer | undefined>(undefined);

  React.useEffect(() => {
    if (map === undefined) return;

    /**
     * Display the GBIF layer below all other overlays, but above base map
     * (so that GBIF layer does not obscure the labels overlay)
     */
    const customPaneName = 'customPane';
    const customPane = map.createPane(customPaneName);
    const layersPaneZindex = getLayerPaneZindex(map);
    customPane.style.zIndex = (layersPaneZindex + 1).toString();

    if (overlay.current) map.removeLayer(overlay.current);
    overlay.current = getGbifLayer(
      {
        ...(range[0] === rangeDefaults[0] && range[1] === rangeDefaults[1]
          ? {}
          : { year: `${range[0]},${range[1]}` }),
        ...mapData,
      },
      customPaneName
    );
    map.addLayer(overlay.current);
  }, [map, range, mapData]);

  return <LeafletMap dialog={false} forwardRef={setMap} />;
}
