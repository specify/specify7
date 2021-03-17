'use strict';

const $ = require('jquery');
const latlongutils = require('./latlongutils.js');

const L = require('leaflet');
require('leaflet/dist/leaflet.css');
/* This code is needed to properly load the images in the Leaflet CSS */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

//create a "full screen" button
L.Control.FullScreen = L.Control.extend({
  onAdd: map => {
    const img = L.DomUtil.create('img');
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

    this.img = img;

    return img;
  },

  onRemove: () => {
  },
});

function toggleFullScreen(map) {
  const dialog = $(map._container.closest('.ui-dialog-content'));
  const [width, height] = dialog[0].parentElement.style.top === '0px' ?
    [900, 600] :
    [window.innerWidth, window.innerHeight];
  dialog.dialog('option', 'width', width);
  dialog.dialog('option', 'height', height);
  map.invalidateSize();
}

L.Control.Details = L.Control.extend({
  onAdd: map => {
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


const Leaflet = {

  cellIsValid: (row, columnIndexes, columnName) =>
    typeof columnIndexes[columnName] !== 'undefined' &&
    columnIndexes[columnName] !== -1 &&
    row[columnIndexes[columnName]] !== null,

  formatCoordinate(row, columnIndexes, columnName) {
    if (
      row[columnIndexes[columnName]] === 0 ||
      row[columnIndexes[columnName]] === '0'
    )
      return 0;
    const coordinate =
      latlongutils.parse(row[columnIndexes[columnName]]).toDegs();
    return coordinate._components[0] * coordinate._sign;
  },

  getLocalityCoordinate(row, columnIndexes, acceptPolygons = false) {

    const cellIsValid = (columnName) =>
      this.cellIsValid(row, columnIndexes, columnName);
    const formatCoordinate = (columnName) =>
      this.formatCoordinate(row, columnIndexes, columnName);

    if (
      !cellIsValid('latitude1') ||
      !cellIsValid('longitude1')
    )
      return false;

    const pointData = {};
    try {

      pointData.latitude1 = formatCoordinate('latitude1');
      pointData.longitude1 = formatCoordinate('longitude1');

      if (
        acceptPolygons &&
        cellIsValid('latitude2') &&
        cellIsValid('longitude2') &&
        (
          !cellIsValid('latlongtype') ||
          row[columnIndexes.latlongtype].toLowerCase() !== 'point'
        )
      ) {
        pointData.latitude2 = formatCoordinate('latitude2');
        pointData.longitude2 = formatCoordinate('longitude2');
        pointData.latlongtype = (
          cellIsValid('latlongtype') &&
          row[columnIndexes.latlongtype].toLowerCase() === 'line'
        ) ? 'Line' : 'Rectangle';
      }
    }
    catch (e) {
      return false;
    }

    if (cellIsValid('localityname'))
      pointData.localityname = row[columnIndexes.localityname];

    if (cellIsValid('latlongaccuracy'))
      pointData.latlongaccuracy = row[columnIndexes.latlongaccuracy];

    return pointData;

  },

  getLocalityColumnsFromSelectedCell(localityColumns, selectedColumn) {

    if (localityColumns.length === 0)
      return false;


    if (localityColumns.length > 1) {
      // if there are multiple localities present in a row, check which
      // group this field belongs too
      let currentLocalityColumns;
      const localityColumnsToSearchFor = [
        'localityname',
        'latitude1',
        'longitude1',
        'latlongtype',
        'latlongaccuracy',
      ];
      if (localityColumns.some(localLocalityColumns =>
        Object.fromEntries(
          localLocalityColumns,
        ).some((fieldName, columnIndex) => {
          if (
            localityColumnsToSearchFor.indexOf(fieldName) !== -1 &&
            columnIndex === selectedColumn
          )
            return currentLocalityColumns = localLocalityColumns;
        }),
      ))
        return currentLocalityColumns;
      else
        return false;  // if can not determine the group the column belongs too
    }
    else
      return localityColumns[0];

  },

  getLocalitiesDataFromSpreadsheet(localityColumns, spreadsheetData) {

    return localityColumns.reduce((localityPoints, columnIndexes) => {

      spreadsheetData.map((row, index) => {
        const localityCoordinate =
          this.getLocalityCoordinate(row, columnIndexes, true);

        if (!localityCoordinate)
          return;

        localityCoordinate.rowNumber = index;
        localityPoints.push(localityCoordinate);
      });

      return localityPoints;

    }, []);

  },

  getLocalityDataFromLocalityResource(localityResource) {
    return new Promise(resolve =>
      Promise.all(
        localityFieldsToGet.map(fieldName =>
          new Promise(resolve =>
            localityResource.rget(fieldName).done(fieldValue =>
              resolve([fieldName, fieldValue]),
            ),
          ),
        ),
      ).then(localityFieldsArray => {
        const localityFields = Object.fromEntries(localityFieldsArray);
        resolve(localityFields);
      }),
    );
  },

  getMarkersFromLocalityResource(localityResource, iconClass) {
    return new Promise(resolve =>
      this.getLocalityDataFromLocalityResource(
        localityResource,
      ).then(localityFields => {
        const markers = this.displayLocalityOnTheMap({
          localityFields,
          iconClass,
        });
        resolve(markers);
      }));
  },

  showLeafletMap({
    localityPoints = [],
    markerClickCallback = () => {
    },
    leafletMapContainer,
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


    let defaultCenter = [0, 0];
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
    Leaflet.addMarkersToMap(
      map,
      controlLayers,
      localityPoints.map(pointDataDict =>
        this.displayLocalityOnTheMap({
          localityData: pointDataDict,
          markerClickCallback: markerClickCallback.bind(
            null,
            index++,
          ),
          map: map,
        }),
      ).flat(),
      'Polygon boundaries',
      true,
    );

    this.addFullScreenButton(map);

    return map;

  },

  addFullScreenButton(map) {
    L.control.fullScreen = opts =>
      new L.Control.FullScreen(opts);
    L.control.fullScreen({position: 'topleft'}).addTo(map);
  },

  addDetailsButton(container, map, details) {
    L.control.details = opts =>
      new L.Control.Details(opts);
    L.control.details({position: 'topleft'}).addTo(map);
    const detailsContainer =
      container.getElementsByClassName('details-container')[0];
    detailsContainer.getElementsByTagName('span').innerHTML = details;
    return detailsContainer;
  },

  addMarkersToMap(map, controlLayers, markers, layerName, enable = false) {

    if (markers.length === 0)
      return;

    const layer = L.layerGroup(markers);
    controlLayers.addOverlay(layer, layerName);
    layer.addTo(map);

    if (enable)
      map.addLayer(layer);

  },

  displayLocalityOnTheMap({
    localityData: {
      latitude1,
      longitude1,
      latitude2 = null,
      longitude2 = null,
      latlongtype = null,
      latlongaccuracy = null,
      localityname = null,
    },
    markerClickCallback,
    map,
    iconClass,
  }) {

    if (latitude1 === null || longitude1 === null)
      return [];

    const icon = new L.Icon.Default();
    if (typeof iconClass !== 'undefined')
      icon.options.className = iconClass;

    const createPoint = (latitude1, longitude1) =>
      L.marker([latitude1, longitude1], {
        icon: icon,
      });

    let vectors = [];

    function isValidAccuracy(latlongaccuracy) {
      try {
        if (parseFloat(latlongaccuracy) < 1 || latlongaccuracy === null)
          return false;
      }
      catch (err) {
        return false;
      }
      return true;
    }

    if (latitude2 === null || longitude2 === null) {

      // a point
      if (!isValidAccuracy(latlongaccuracy))
        vectors.push(createPoint(latitude1, longitude1));

      // a circle
      else
        vectors.push(
          L.circle([latitude1, longitude1], {
            icon: icon,
            radius: latlongaccuracy,
          }),
          createPoint(latitude1, longitude1),
        );

    }

    else
      vectors.push(
        latlongtype === 'Line' ?
          // a line
          new L.Polyline([
            [latitude1, longitude1],
            [latitude2, longitude2],
          ], {
            icon: icon,
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
          ], {
            icon: icon,
          }),
        createPoint(latitude1, longitude1),
        createPoint(latitude2, longitude2),
      );


    const polygonBoundaries = [];

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
        localityname !== null
      )
        vector.bindPopup(localityname);

    });

    return polygonBoundaries;

  },

  showCOMap(mapContainer, listOfLayersRaw, details = undefined) {

    const listOfLayers = [
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

    const formatLayersDict = (listOfLayers) => Object.fromEntries(
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

    this.addFullScreenButton(map);

    if (typeof details !== 'undefined')
      return [
        map,
        layerGroup,
        this.addDetailsButton(mapContainer, map, details),
      ];

    return [map, layerGroup];

  },

};


const leafletTileServers = {
  baseMaps: {
    'OpenStreetMap Standart':
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
        options: {
          maxZoom: 20,
          attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: {attribution.OpenStreetMap}',
        },
      }),
    'OpenStreetMap Transport':
      L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
        options: {
          maxZoom: 20,
          attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: {attribution.OpenStreetMap}',
        },
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

const coMapTileServers = [
  {
    transparent: false,
    layer_label: 'ESRI: WorldImagery',
  },
  {
    transparent: true,
    layer_label: 'ESRI: Canvas/World_Dark_Gray_Reference',
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

module.exports = Leaflet;