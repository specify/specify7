"use strict";

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


const Leaflet = {

    cellIsValid: (row, column_indexes, column_name) =>
        typeof column_indexes[column_name] !== "undefined" &&
        column_indexes[column_name] !== -1 &&
        row[column_indexes[column_name]] !== null,

    formatCoordinate(row, column_indexes, column_name){
        if (row[column_indexes[column_name]] === 0 || row[column_indexes[column_name]] === '0')
            return 0;
        const coordinate = latlongutils.parse(row[column_indexes[column_name]]).toDegs();
        return coordinate._components[0] * coordinate._sign;
    },

    getLocalityCoordinate(row, column_indexes, accept_polygons = false){

        const cellIsValid = (column_name) => this.cellIsValid(row, column_indexes, column_name);
        const formatCoordinate = (column_name) => this.formatCoordinate(row, column_indexes, column_name);

        if (
            !cellIsValid('latitude1') ||
            !cellIsValid('longitude1')
        )
            return false;

        const point_data = {};
        try {

            point_data.latitude1 = formatCoordinate('latitude1');
            point_data.longitude1 = formatCoordinate('longitude1');

            if (
                accept_polygons &&
                cellIsValid('latitude2') &&
                cellIsValid('longitude2') &&
                (
                    !cellIsValid('latlongtype') ||
                    row[column_indexes.latlongtype].toLowerCase() !== 'point'
                )
            ) {
                point_data.latitude2 = formatCoordinate('latitude2');
                point_data.longitude2 = formatCoordinate('longitude2');
                point_data.latlongtype = (
                    cellIsValid('latlongtype') &&
                    row[column_indexes.latlongtype].toLowerCase() === 'line'
                ) ? 'Line' : 'Rectangle';
            }
        } catch (e) {
            return false;
        }

        if (cellIsValid('localityname'))
            point_data.localityname = row[column_indexes.localityname];

        if (cellIsValid('latlongaccuracy'))
            point_data.latlongaccuracy = row[column_indexes.latlongaccuracy];

        return point_data;

    },

    getLocalityColumnsFromSelectedCell(locality_columns, selected_column){

        if (locality_columns.length === 0)
            return false;


        if (locality_columns.length > 1) {
            // if there are multiple localities present in a row, check which group this field belongs too
            let current_locality_columns;
            const locality_columns_to_search_for = ['localityname', 'latitude1', 'longitude1', 'latlongtype', 'latlongaccuracy'];
            if (locality_columns.some(local_locality_columns =>
                Object.fromEntries(local_locality_columns).some((field_name, column_index) => {
                    if (
                        locality_columns_to_search_for.indexOf(field_name) !== -1 &&
                        column_index === selected_column
                    )
                        return current_locality_columns = local_locality_columns;
                })
            ))
                return current_locality_columns;
            else
                return false;  // if can not determine the group the column belongs too
        }
        else
            return locality_columns[0];

    },

    getLocalitiesDataFromSpreadsheet(locality_columns, spreadsheet_data){

        return locality_columns.reduce((locality_points, column_indexes) => {

            spreadsheet_data.map((row, index) => {
                const locality_coordinate = this.getLocalityCoordinate(row, column_indexes, true);

                if (!locality_coordinate)
                    return;

                locality_coordinate.row_number = index;
                locality_points.push(locality_coordinate);
            });

            return locality_points;

        }, []);

    },

    getLocalityDataFromLocalityResource(locality_resource){
        return new Promise(resolve =>
            Promise.all(
                locality_fields_to_get.map(field_name =>
                    new Promise(resolve =>
                        locality_resource.rget(field_name).done(field_value =>
                            resolve([field_name, field_value])
                        )
                    )
                )
            ).then(locality_fields_array => {
                const locality_fields = Object.fromEntries(locality_fields_array);
                resolve(locality_fields);
            })
        );
    },

    getMarkersFromLocalityResource(locality_resource, icon_class){
        return new Promise(resolve =>
            this.getLocalityDataFromLocalityResource(locality_resource).then(locality_fields => {
                const markers = this.displayLocalityOnTheMap({
                    locality_data: locality_fields,
                    icon_class: icon_class
                });
                resolve(markers);
            }));
    },

    showLeafletMap({
        locality_points = [],
        marker_click_callback = () => {
        },
        leaflet_map_container
    }){

        if (typeof leaflet_map_container === "undefined")
            leaflet_map_container = $(`<div id="leaflet_map"></div>`);

        leaflet_map_container.dialog({
            width: 900,
            height: 600,
            title: "Leaflet map",
            close: function(){
                map.remove();
                $(this).remove();
            },
        });


        let defaultCenter = [0, 0];
        let defaultZoom = 1;
        if (locality_points.length > 0) {
            defaultCenter = [locality_points[0].latitude1, locality_points[0].longitude1];
            defaultZoom = 5;
        }

        const map = L.map(leaflet_map_container[0], {
            layers: [
                Object.values(leaflet_tile_servers.base_maps)[0],
            ],
        }).setView(defaultCenter, defaultZoom);
        const control_layers = L.control.layers(leaflet_tile_servers.base_maps, leaflet_tile_servers.overlays);
        control_layers.addTo(map);

        let index = 1;
        Leaflet.addMarkersToMap(
            map,
            control_layers,
            locality_points.map(point_data_dict =>
                this.displayLocalityOnTheMap({
                    locality_data: point_data_dict,
                    marker_click_callback: () => marker_click_callback(index++),
                    map: map
                })
            ).flat(),
            'Polygon boundaries',
            true
        );

        return map;

    },

    addMarkersToMap(map, control_layers, markers, layer_name, enable=false){

        if(markers.length === 0)
            return;

        const layer = L.layerGroup(markers);
        control_layers.addOverlay(layer, layer_name);
        layer.addTo(map);

        if(enable)
            map.addLayer(layer);

    },

    displayLocalityOnTheMap({
        locality_data: {
            latitude1,
            longitude1,
            latitude2 = null,
            longitude2 = null,
            latlongtype = null,
            latlongaccuracy = null,
            localityname = null,
        },
        marker_click_callback,
        map,
        icon_class
    }){

        const icon = new L.Icon.Default();
        if (typeof icon_class !== "undefined")
            icon.options.className = icon_class;

        const create_a_point = (latitude1, longitude1) =>
            L.marker([latitude1, longitude1], {
                icon: icon,
            });

        let vectors = [];

        if (latitude2 === null || longitude2 === null) {

            // a point
            if (latlongaccuracy === null || latlongaccuracy === "0")
                vectors.push(create_a_point(latitude1, longitude1));

            // a circle
            else
                vectors.push(
                    L.circle([latitude1, longitude1], {
                        icon: icon,
                        radius: latlongaccuracy
                    }),
                    create_a_point(latitude1, longitude1)
                );

        }

        else
            vectors.push(
                latlongtype === 'Line' ?
                    // a line
                    new L.Polyline([
                        [latitude1, longitude1],
                        [latitude2, longitude2]
                    ], {
                        icon: icon,
                        weight: 3,
                        opacity: 0.5,
                        smoothFactor: 1
                    }) :
                    // a polygon
                    L.polygon([
                        [latitude1, longitude1],
                        [latitude2, longitude1],
                        [latitude2, longitude2],
                        [latitude1, longitude2]
                    ], {
                        icon: icon,
                    }),
                create_a_point(latitude1, longitude1),
                create_a_point(latitude2, longitude2)
            );


        const polygon_boundaries = [];

        let is_first_vector = true;
        vectors.map(vector => {

            if (is_first_vector && typeof map !== "undefined") {
                vector.addTo(map);
                is_first_vector = false;
            }
            else
                polygon_boundaries.push(vector);

            if (typeof marker_click_callback === "string")
                vector.bindPopup(marker_click_callback);
            else if (typeof marker_click_callback === "function")
                vector.on('click', marker_click_callback);
            else if (typeof marker_click_callback === "undefined" && localityname !== null)
                vector.bindPopup(localityname);

        });

        return polygon_boundaries;

    },

    showCOMap(list_of_layers_raw){

        const list_of_layers = list_of_layers_raw.map(({transparent, layer_label, tile_layer: {map_url, options}}) =>
            ({
                transparent: transparent,
                layer_label: layer_label,
                tile_layer: L.tileLayer.wms(map_url, options)
            })
        );

        const format_layers_dict = (list_of_layers) => Object.fromEntries(
            list_of_layers.map(({_, layer_label, tile_layer}) =>
                [layer_label, tile_layer]
            )
        );

        const all_layers = Object.values(format_layers_dict(list_of_layers));
        const overlay_layers = format_layers_dict(list_of_layers.filter(({transparent}) => transparent));

        const map = L.map('lifemapper_leaflet_map', {
            crs: L.CRS.EPSG4326,
            layers: all_layers,
        }).setView([0, 0], 1);

        const layer_group = L.control.layers({}, overlay_layers);
        layer_group.addTo(map);

        return [map, layer_group];

    },

};


const leaflet_tile_servers = {
    base_maps: {
        'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }),
        'ESRI: World_Street_Map': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, (c) OpenStreetMap contributors, and the GIS User Community',
        }),
        'ESRI: World_Topo_Map': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Sources: Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), (c) OpenStreetMap contributors, and the GIS User Community',
        }),
        'ESRI: WorldImagery': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        }),
        'GeoportailFrance orthos': L.tileLayer('https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
            attribution: '<a target="_blank" href="https://www.geoportail.gouv.fr/">Geoportail France</a>',
            bounds: [[-75, -180], [81, 180]],
            minZoom: 2,
            maxZoom: 19,
            apikey: 'choisirgeoportail',
            format: 'image/jpeg',
            style: 'normal'
        }),
        'USGS USImagery': L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 20,
            attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
        }),
    },
    overlays: {
        'ESRI: Reference/World_Boundaries_and_Places': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community',
        }),
        'ESRI: Reference/World_Boundaries_and_Places_Alternate': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community',
        }),
        'ESRI: Canvas/World_Dark_Gray_Reference': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community\n',
        }),
        'ESRI: Reference/World_Reference_Overlay': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Sources: Esri, Garmin, USGS, NPS',
        }),
    }
};
const locality_fields_to_get = ['localityname', 'latitude1', 'longitude1', 'latitude2', 'longitude2', 'latlongtype', 'latlongaccuracy'];

module.exports = Leaflet;