'use strict';

import $ from 'jquery';
import latlongutils from './latlongutils.js';
import L   from 'leaflet';

import'leaflet/dist/leaflet.css';
/* This code is needed to properly load the images in the Leaflet CSS */
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

//create a "full screen" button
// @ts-ignore
L.Control.FullScreen = L.Control.extend({
  onAdd: (map:L.Map) => {
    const img = L.DomUtil.create('img') as HTMLImageElement;
    img.style.cursor = 'pointer';
    img.classList.add('full-screen');

    L.DomEvent.on(
      img, 'click', L.DomEvent.stopPropagation,
    ).on(
      img, 'click', L.DomEvent.preventDefault,
    ).on(
      img, 'click', () => toggleFullScreen(map),
    );

    img.src = '/static/img/full_screen.png';
    img.style.width = '50px';

    // @ts-ignore
    this.img = img;

    return img;
  },

  onRemove: () => {
  },
});

function toggleFullScreen(map:L.Map) {
  // @ts-ignore
  const dialog = $(map._container.closest('.ui-dialog-content'));
  const [width, height] = dialog[0].parentElement.style.top === '0px' ?
    [900, 600] :
    [window.innerWidth, window.innerHeight];
  dialog.dialog('option', 'width', width);
  dialog.dialog('option', 'height', height);
  map.invalidateSize();
}

// @ts-ignore
L.Control.Details = L.Control.extend({
  onAdd: () => {
    const details = L.DomUtil.create('details');
    details.classList.add('details-container');
    details.setAttribute('open', 'open');
    details.style.background = '#000c';
    details.style.padding = '10px';
    details.style.maxWidth = '50%';
    details.style.minWidth = '92px';
    details.innerHTML = `
      <summary style="font-size:1rem">Details</summaryi>
      <span></span>
    `;

    return details;
  },

  onRemove: () => {
  },
});


const cellIsValid = (
  row:string[],
  columnIndexes:Record<string, number>,
  columnName:string
):boolean =>
  typeof columnIndexes[columnName] !== 'undefined' &&
  columnIndexes[columnName] !== -1 &&
  row[columnIndexes[columnName]] !== null;

function formatCoordinate(
  row:string[],
  columnIndexes:Record<string, number>,
  columnName:string
):number {

  if (row[columnIndexes[columnName]] === '0')
    return 0;

  const coordinate =
    (latlongutils as any).parse(row[columnIndexes[columnName]]).toDegs() as {
      _components: [number],
      _sign: 1|-1
    };
  return coordinate._components[0] * coordinate._sign;
}


interface BareLocalityData {
  latitude1: number,
  longitude1: number,
}

interface ComplexLocalityCoordinate {
  latitude2: number,
  longitude2: number,
  latlongtype: 'point' | 'line' | 'rectangle'
}

interface NamedLocality {
  localityname?: string
}

interface LocalityWithAccuracy {
  latlongaccuracy?: number
}

type AllOrNothing<T> = T|Record<keyof T,undefined>;

type LocalityData = BareLocalityData &
  AllOrNothing<ComplexLocalityCoordinate> &
  NamedLocality &
  LocalityWithAccuracy;

type LocalityField = keyof (
  BareLocalityData
  & ComplexLocalityCoordinate
  & NamedLocality
  & LocalityWithAccuracy
);

type LocalityColumnIndexes = Record<LocalityField,number>;

export function getLocalityCoordinate(
  row:string[],
  columnIndexes:Record<string, number>,
  acceptPolygons = false
):LocalityData|false {

  const cellIsValidCurried = (columnName:string) =>
    cellIsValid(row, columnIndexes, columnName);
  const formatCoordinateCurried = (columnName:string) =>
    formatCoordinate(row, columnIndexes, columnName);

  if (
    !cellIsValidCurried('latitude1') ||
    !cellIsValidCurried('longitude1')
  )
    return false;

  try {

    return {
      latitude1: formatCoordinateCurried('latitude1'),
      longitude1: formatCoordinateCurried('longitude1'),
      ...(
        (
          acceptPolygons &&
          cellIsValidCurried('latitude2') &&
          cellIsValidCurried('longitude2') &&
          (
            !cellIsValidCurried('latlongtype') ||
            row[columnIndexes.latlongtype].toLowerCase() !== 'point'
          )
        ) ?
          {
            latitude2: formatCoordinateCurried('latitude2'),
            longitude2: formatCoordinateCurried('longitude2'),
            latlongtype: (
              cellIsValidCurried('latlongtype') &&
              row[columnIndexes.latlongtype].toLowerCase() === 'line'
            ) ? 'Line' : 'Rectangle'
          } :
          {}
      ),
      localityname: cellIsValidCurried('localityname') ?
        row[columnIndexes.localityname] :
        undefined,
      latlongaccuracy: cellIsValidCurried('latlongaccuracy') ?
        parseInt(row[columnIndexes.latlongaccuracy]) :
        undefined,
    } as LocalityData;

  }
  catch (e) {
    return false;
  }

}

const localityColumnsToSearchFor:LocalityField[] = [
  'localityname',
  'latitude1',
  'longitude1',
  'latlongtype',
  'latlongaccuracy',
];

// if there are multiple localities present in a row, check which
// group this field belongs too
export const getLocalityColumnsFromSelectedCell = (
  localityColumns:LocalityColumnIndexes[],
  selectedColumn:number
):LocalityColumnIndexes|false =>
  localityColumns.filter(localLocalityColumns=>
    localityColumnsToSearchFor.indexOf(
      Object.keys(
        localLocalityColumns
      )[Object.values(
        localLocalityColumns
      ).indexOf(selectedColumn)] as LocalityField
    ) !== -1
  )[0] || false;

// export const getLocalitiesDataFromSpreadsheet = (
//   localityColumns:LocalityColumnIndexes[],
//   spreadsheetData:string[][]
// )=>
//   localityColumns.reduce((localityPoints, columnIndexes) =>
//     [
//       ...localityPoints,
//       ...spreadsheetData.map((row, index) =>
//         [
//           getLocalityCoordinate(row, columnIndexes, true),
//           index
//         ]
//       ).filter(([localityCoordinate])=>
//         localityCoordinate
//       ).map(([localityCoordinate, index])=>({
//         ...localityCoordinate,
//         rowNumber: index,
//       }))
//     ], []);

export const getLocalityDataFromLocalityResource = (
  localityResource:any
):Promise<LocalityData>=>
  new Promise(resolve =>
    Promise.all(
      localityFieldsToGet.map(fieldName =>
        new Promise(resolve =>
          localityResource.rget(fieldName).done((fieldValue:any) =>
            resolve([fieldName, fieldValue]),
          ),
        ),
      ),
    ).then((localityFieldsArray:any) => {
      const localityFields = Object.fromEntries(localityFieldsArray);
      resolve(localityFields as LocalityData);
    }),
  );

export const getMarkersFromLocalityResource = async (
  localityResource:any,
  iconClass:string|undefined
)=>
  displayLocalityOnTheMap({
    localityData: await getLocalityDataFromLocalityResource(
      localityResource,
    ),
    iconClass,
  });

export function showLeafletMap({
  localityPoints = [],
  markerClickCallback = () => {},
  leafletMapContainer,
}:{
  localityPoints: LocalityData[],
  markerClickCallback: ()=>void,
  leafletMapContainer: JQuery<HTMLDivElement>|undefined
}) {

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

function displayLocalityOnTheMap({
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
      latlongtype === 'line' ?
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
      options: Record<string,unknown>
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



const leafletTileServers:Record<
  'baseMaps'|'overlays',
  Record<string,L.TileLayer>
> = {
  baseMaps: {
    'OpenStreetMap Standard':
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }),
    'OpenStreetMap Humanitarian':
      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b'],
      }),
    'OpenStreetMap CyclOSM':
      L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: {attribution.OpenStreetMap}',
      }),
    'OpenStreetMap Transport':
      L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: {attribution.OpenStreetMap}',
      }),
    'ESRI: World_Street_Map':
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, (c) OpenStreetMap contributors, and the GIS User Community',
      }),
    'ESRI: World_Topo_Map':
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Sources: Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), (c) OpenStreetMap contributors, and the GIS User Community',
      }),
    'ESRI: WorldImagery':
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }),
    'GeoportailFrance orthos':
      L.tileLayer('https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
        attribution: '<a target="_blank" href="https://www.geoportail.gouv.fr/">Geoportail France</a>',
        bounds: [[-75, -180], [81, 180]],
        minZoom: 2,
        maxZoom: 19,
        //TODO: get an api key
        // @ts-ignore
        apikey: 'choisirgeoportail',
        format: 'image/jpeg',
        style: 'normal',
      }),
    'USGS USImagery':
      L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 20,
        attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>',
      }),
    'NASAGIBS ModisTerraTrueColorCR':
      L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_TrueColor/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
        attribution:
          'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
          '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
        bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
        minZoom: 1,
        maxZoom: 9,
        // @ts-ignore
        format: 'jpg',
        time: '',
        tilematrixset: 'GoogleMapsCompatible_Level',
      }),
    'NASAGIBS ModisTerraBands367CR':
      L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_TrueColor/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
        attribution:
          'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
          '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
        bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
        minZoom: 1,
        maxZoom: 9,
        // @ts-ignore
        format: 'jpg',
        time: '',
        tilematrixset: 'GoogleMapsCompatible_Level',
      }),
    'NASAGIBS ViirsEarthAtNight2012':
      L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
        attribution:
          'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
          '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
        bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
        minZoom: 1,
        maxZoom: 8,
        // @ts-ignore
        format: 'jpg',
        time: '',
        tilematrixset: 'GoogleMapsCompatible_Level',
      }),
    'NASAGIBS ModisTerraLSTDay':
      L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_Land_Surface_Temp_Day/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
        attribution:
          'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
          '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
        bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
        minZoom: 1,
        maxZoom: 7,
        opacity: 0.75,
        // @ts-ignore
        format: 'png',
        time: '',
        tilematrixset: 'GoogleMapsCompatible_Level',
      }),
    'NASAGIBS ModisTerraAOD':
      L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_Aerosol/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
        attribution:
          'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
          '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
        bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
        minZoom: 1,
        maxZoom: 6,
        opacity: 0.75,
        // @ts-ignore
        format: 'png',
        time: '',
        tilematrixset: 'GoogleMapsCompatible_Level',
      }),
    'NASAGIBS ModisTerraChlorophyll':
      L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_Chlorophyll_A/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
        attribution:
          'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
          '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
        bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
        minZoom: 1,
        maxZoom: 7,
        opacity: 0.75,
        // @ts-ignore
        format: 'png',
        time: '',
        tilematrixset: 'GoogleMapsCompatible_Level',
      }),
  },
  overlays: {
    'ESRI: Reference/World_Boundaries_and_Places':
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community',
      }),
    'ESRI: Reference/World_Boundaries_and_Places_Alternate':
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community',
      }),
    'ESRI: Canvas/World_Dark_Gray_Reference':
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community\n',
      }),
    'ESRI: Reference/World_Reference_Overlay':
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Sources: Esri, Garmin, USGS, NPS',
      }),
  },
};

const coMapTileServers:{
  transparent: boolean,
  layerLabel: string
}[] = [
  {
    transparent: false,
    layerLabel: 'ESRI: WorldImagery',
  },
  {
    transparent: true,
    layerLabel: 'ESRI: Canvas/World_Dark_Gray_Reference',
  },
];

const localityFieldsToGet = [
  'localityname',
  'latitude1',
  'longitude1',
  'latitude2',
  'longitude2',
  'latlongtype',
  'latlongaccuracy'
];
