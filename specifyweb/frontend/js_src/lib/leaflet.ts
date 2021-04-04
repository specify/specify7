/*
* Utility functions for rendering a Leaflet map
* */

'use strict';

import $ from 'jquery';
import { R } from './components/wbplanview';
import { coMapTileServers, leafletTileServers } from './leafletconfig';
import L from './leafletextend';
import { LocalityData } from './leafletutils';


export function showLeafletMap({
  localityPoints = [],
  markerClickCallback = () => {},
  leafletMapContainer,
}:{
  localityPoints: LocalityData[],
  markerClickCallback: ()=>void,
  leafletMapContainer: JQuery<HTMLDivElement>|undefined
}):L.Map {

  if (typeof leafletMapContainer === 'undefined')
    leafletMapContainer = $(`<div></div>`);

  leafletMapContainer.dialog({
    width: 900,
    height: 600,
    title: 'Leaflet map',
    close: function() {
      map.remove();
      $(this).remove();
    },
  });


  let defaultCenter:[number, number] = [0, 0];
  let defaultZoom = 1;
  if (localityPoints.length > 0) {
    defaultCenter = [
      localityPoints[0].latitude1,
      localityPoints[0].longitude1,
    ];
    defaultZoom = 5;
  }

  const map = L.map(leafletMapContainer[0], {
    layers: [
      Object.values(leafletTileServers.baseMaps)[0],
    ],
  }).setView(defaultCenter, defaultZoom);
  const controlLayers = L.control.layers(
    leafletTileServers.baseMaps,
    leafletTileServers.overlays,
  );
  controlLayers.addTo(map);

  let index = 0;
  addMarkersToMap(
    map,
    controlLayers,
    localityPoints.map(pointDataDict =>
      displayLocalityOnTheMap({
        localityData: pointDataDict,
        markerClickCallback: markerClickCallback.bind(
          null,
          index++,
        ),
        map,
      }),
    ).flat(),
    'Polygon boundaries',
    true,
  );

  addFullScreenButton(map);

  return map;

}

function addFullScreenButton(map:L.Map) {
  // @ts-ignore
  L.control.fullScreen = (opts:any) => new L.Control.FullScreen(opts);
  // @ts-ignore
  L.control.fullScreen({position: 'topleft'}).addTo(map);
}

function addDetailsButton(
  container:HTMLDivElement,
  map:L.Map,
  details:string
){
  // @ts-ignore
  L.control.details = opts => new L.Control.Details(opts);
  // @ts-ignore
  L.control.details({position: 'topleft'}).addTo(map);
  const detailsContainer =
    container.getElementsByClassName('details-container')[0];
  detailsContainer.getElementsByTagName('span')[0].innerHTML = details;
  return detailsContainer;
}

export function addMarkersToMap(
  map:L.Map,
  controlLayers:any,
  markers:any,
  layerName:string,
  enable = false
) {

  if (markers.length === 0)
    return;

  const layer = L.layerGroup(markers);
  controlLayers.addOverlay(layer, layerName);
  layer.addTo(map);

  if (enable)
    map.addLayer(layer);

}

export function displayLocalityOnTheMap({
  localityData: {
    latitude1,
    longitude1,
    latitude2 = undefined,
    longitude2 = undefined,
    latlongtype = undefined,
    latlongaccuracy = undefined,
    localityname = undefined,
  },
  markerClickCallback,
  map,
  iconClass,
}:{
  localityData: LocalityData,
  markerClickCallback?: string|(()=>void),
  map?: any,
  iconClass?: string
}) {

  if (typeof latitude1 === 'undefined' || typeof 'longitude1' === undefined)
    return [];

  const icon = new L.Icon.Default();
  if (typeof iconClass !== 'undefined')
    icon.options.className = iconClass;

  const createPoint = (latitude1:number, longitude1:number) =>
    L.marker([latitude1, longitude1], {
      icon: icon,
    });

  const vectors = [];

  function isValidAccuracy(latlongaccuracy:string|number|undefined) {
    try {
      if (
        typeof latlongaccuracy === 'undefined' ||
        (
          typeof latlongaccuracy === 'number' &&
          latlongaccuracy < 1
        ) ||
        (
          typeof latlongaccuracy === 'string' &&
          parseFloat(latlongaccuracy) < 1
        )
      )
        return false;
    }
    catch (err) {
      return false;
    }
    return true;
  }

  if (
    typeof latitude2 === 'undefined' ||
    typeof longitude2 === 'undefined'
  ) {

    // a circle
    if (isValidAccuracy(latlongaccuracy))
      vectors.push(
        L.circle([latitude1, longitude1], {
          radius: latlongaccuracy,
        }),
        createPoint(latitude1, longitude1),
      );

    // a point
    else
      vectors.push(createPoint(latitude1, longitude1));

  }

  else
    vectors.push(
      latlongtype?.toLowerCase() === 'line' ?
        // a line
        new L.Polyline([
          [latitude1, longitude1],
          [latitude2, longitude2],
        ], {
          weight: 3,
          opacity: 0.5,
          smoothFactor: 1,
        }) :
        // a polygon
        L.polygon([
          [latitude1, longitude1],
          [latitude2, longitude1],
          [latitude2, longitude2],
          [latitude1, longitude2],
        ]),
      createPoint(latitude1, longitude1),
      createPoint(latitude2, longitude2),
    );


  const polygonBoundaries:typeof vectors = [];

  let isFirstVector = true;
  vectors.map(vector => {

    if (isFirstVector && typeof map !== 'undefined') {
      vector.addTo(map);
      isFirstVector = false;
    }
    else
      polygonBoundaries.push(vector);

    if (typeof markerClickCallback === 'string')
      vector.bindPopup(markerClickCallback);
    else if (typeof localityname === 'string' && localityname.length>0)
      vector.bindPopup(localityname);
    else if (typeof markerClickCallback === 'function')
      vector.on('click', markerClickCallback);
    else if (
      typeof markerClickCallback === 'undefined' &&
      typeof localityname !== 'undefined'
    )
      vector.bindPopup(localityname);

  });

  return polygonBoundaries;

}

export function showCOMap(
  mapContainer:HTMLDivElement,
  listOfLayersRaw:{
    transparent: boolean,
    layerLabel: string,
    tileLayer: {
      mapUrl: string,
      options: R<unknown>
    }
  }[],
  details:string|undefined = undefined
):[L.Map, L.Control.Layers, HTMLDivElement|undefined] {

  const listOfLayers:{
    transparent: boolean,
    layerLabel: string,
    tileLayer: L.TileLayer.WMS|L.TileLayer,
  }[] = [
    ...coMapTileServers.map(({transparent, layerLabel}) =>
      (
        {
          transparent,
          layerLabel,
          tileLayer: leafletTileServers[(
            transparent ? 'overlays' : 'baseMaps'
          )][layerLabel],
        }
      ),
    ),
    ...listOfLayersRaw.map(({
        transparent,
        layerLabel,
        tileLayer: {mapUrl, options},
      }) =>
        (
          {
            transparent,
            layerLabel,
            tileLayer: L.tileLayer.wms(mapUrl, options),
          }
        ),
    ),
  ];

  const formatLayersDict = (listOfLayers:{
      transparent: boolean,
      layerLabel: string,
      tileLayer: L.TileLayer.WMS|L.TileLayer,
    }[]) => Object.fromEntries(
    listOfLayers.map(({layerLabel, tileLayer}) =>
      [layerLabel, tileLayer],
    ),
  );

  const allLayers = Object.values(formatLayersDict(listOfLayers));
  const overlayLayers = formatLayersDict(
    listOfLayers.filter(({transparent}) => transparent),
  );

  const map = L.map(mapContainer, {
    layers: allLayers,
  }).setView([0, 0], 1);

  const layerGroup = L.control.layers({}, overlayLayers);
  layerGroup.addTo(map);

  addFullScreenButton(map);

  if (typeof details !== 'undefined')
    return [
      map,
      layerGroup,
      addDetailsButton(mapContainer, map, details) as HTMLDivElement,
    ];

  return [map, layerGroup, undefined];

}
