import { filterArray, RA, RR, WritableArray } from '../../utils/types';
import { BrokerRecord } from '../SpecifyNetwork/fetchers';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import { useProjectionLayers } from './projection';
import { LeafletMap } from '../Leaflet/Map';
import { getGbifLayers, useIdbLayers } from './overlays';
import { f } from '../../utils/functools';
import React from 'react';
import { BrokerSection } from '../SpecifyNetwork/Components';
import { fetchLocalOccurrences, OccurrenceData } from './mapData';
import { useAsyncState } from '../../hooks/useAsyncState';
import { LocalityData } from '../Leaflet/helpers';
import {
  formatLocalityData,
  getMarkersFromLocalityData,
  MarkerGroups,
} from '../Leaflet';
import { addMarkersToMap, LeafletInstance } from '../Leaflet/addOns';
import { getResourceViewUrl } from '../DataModel/resource';

export function SpecifyNetworkMap({
  occurrence,
  species,
  speciesName,
}: {
  readonly occurrence: RA<BrokerRecord> | undefined;
  readonly species: RA<BrokerRecord> | undefined;
  readonly speciesName: string | undefined;
}): JSX.Element | null {
  const [occurrences] = useAsyncState(
    React.useCallback(() => fetchLocalOccurrences(resource), [resource]),
    false
  );
  // FIXME: add these to query map
  const projection = useProjectionLayers(speciesName);
  const gbif = React.useMemo(
    () => f.maybe(species, getGbifLayers),
    [species],
    []
  );
  const iDigBio = useIdbLayers(occurrence, speciesName);

  const overlays = {
    ...projection?.layers,
    ...gbif?.layers,
    ...iDigBio?.layers,
  };

  // FIXME: add these to query map
  const layerDetails = filterArray([
    specifyNetworkText.mapDescription(),
    projection?.description,
    gbif?.description,
    iDigBio?.description,
  ]);

  const points = React.useRef<WritableArray<LocalityData>>([]);
  React.useEffect(() => {
    points.current = [];
  }, [species]);
  return Object.keys(overlays).length === 0 &&
    (typeof occurrences === 'undefined' ||
      // eslint-disable-next-line unicorn/no-null
      occurrences.length === 0) ? null : (
    <BrokerSection
      key="map"
      anchor="map"
      label={specifyNetworkText.distribution()}
    >
      {layerDetails.map((value, index) => (
        <p key={index}>{value}</p>
      ))}
      <MapWrapper
        occurrences={occurrence}
        extendedOccurrencePoints={points}
        overlays={overlays}
        origin={origin}
        onMarkerClick={(index): void =>
          void occurrences?.[index].fetchMoreData().then((localityData) =>
            typeof localityData === 'object'
              ? sendMessage({
                  type: 'PointDataAction',
                  index,
                  localityData,
                })
              : console.error('Failed to fetch locality data')
          )
        }
      />
    </BrokerSection>
  );
}

function MapWrapper({
  occurrences,
  extendedOccurrencePoints,
  overlays,
  onMarkerClick: handleMarkerClick,
}: {
  occurrences: RA<OccurrenceData> | undefined;
  extendedOccurrencePoints: RR<number, LocalityData>;
  overlays: LeafletOverlays;
  onMarkerClick: (index: number) => void;
}) {
  const mapContainer = React.useRef<HTMLDivElement | null>(null);
  const [leafletMap, layerGroup] = useLeaflet({
    mapContainer: mapContainer.current,
    tileLayers,
  });

  const loadedOverlays = React.useRef<Set<string>>(new Set());
  React.useEffect(() => {
    if (typeof leafletMap === 'undefined' || typeof layerGroup === 'undefined')
      return;
    const addedOverlays = Object.keys(overlays).filter(
      (label) => !loadedOverlays.current.has(label)
    );
    const addLayers = addAggregatorOverlays(leafletMap, layerGroup);
    addLayers(
      Object.fromEntries(addedOverlays.map((label) => [label, overlays[label]]))
    );
    addedOverlays.forEach((label) => {
      loadedOverlays.current.add(label);
    });
  }, [overlays]);

  const markers = React.useRef<RA<MarkerGroups>>([]);
  const fetchedMarkers = React.useRef<Set<number>>(new Set());
  React.useEffect(() => {
    if (
      typeof occurrences === 'undefined' ||
      typeof leafletMap === 'undefined' ||
      typeof layerGroup === 'undefined'
    )
      return;

    markers.current = occurrences.map(
      ({ localityData, collectionObjectId }, index) =>
        getMarkersFromLocalityData({
          localityData,
          markerClickCallback() {
            if (fetchedMarkers.current.has(index)) return;
            handleMarkerClick(index);
          },
          viewUrl: getResourceViewUrl('CollectionObject', collectionObjectId),
        })
    );
    addMarkersToMap(leafletMap, layerGroup, markers.current);
  }, [occurrences]);

  const loadedExtendedOccurrencePoints = React.useRef<Set<number>>(new Set());
  React.useEffect(() => {
    if (typeof markers === 'undefined' || typeof occurrences === 'undefined')
      return;
    const newOccurrencePoints = Object.keys(extendedOccurrencePoints).filter(
      (index) =>
        !loadedExtendedOccurrencePoints.current.has(Number.parseInt(index))
    );
    newOccurrencePoints.forEach((rawIndex) => {
      const index = Number.parseInt(rawIndex);
      loadedExtendedOccurrencePoints.current.add(index);
      const localityData = extendedOccurrencePoints[index];
      const formattedLocality = formatLocalityData(
        localityData,
        getResourceViewUrl(
          'CollectionObject',
          occurrences[index].collectionObjectId
        ),
        false
      );

      Object.values(markers.current[index])
        .flat()
        .map((marker) => marker.getPopup()?.setContent(formattedLocality));
    });
  }, [extendedOccurrencePoints]);

  const availableOverlays = Object.keys(overlays);
  React.useEffect(() => {}, [availableOverlays]);

  const [leaflet, setLeaflet] = React.useState<LeafletInstance | null>(null);
  return (
    <LeafletMap
      forwardRef={setLeaflet}
      header={specifyNetworkText.specifyNetworkMap()}
      onClose={f.never}
      dialog={false}
    />
  );
}
