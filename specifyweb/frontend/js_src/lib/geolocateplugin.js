"use strict";

import $ from 'jquery';
import Q from 'q';

import UIPlugin from './uiplugin';
import * as querystring from './querystring';
import schema from './schema';
import localityText from './localization/locality';

export default UIPlugin.extend({
    __name__: "GeoLocatePlugin",
    events: {
        'click': 'click'
    },
    render: function() {
        if (this.model.specifyModel.name !== "Locality") {
            throw new Error("geolocateplugin can only be used with locality resources");
        }
        this.el.textContent = localityText('geoLocate');
        this.el.disabled = false;
        this.geoLocateDialog = undefined;
        return this;
    },
    click: function(event) {

        if(typeof this.geoLocateDialog !== 'undefined'){
            this.geoLocateDialog.dialog('close');
            event.target.ariaPressed = false;
            return;
        }
        event.target.ariaPressed = true;

        event.preventDefault();
        this.geoRefData().done(function(data) {
            data ? this.openGeoLocate(data) : this.geoRequired();
        }.bind(this));
    },
    geoRequired: function() {
        $(`<div>
            ${localityText('geographyRequiredDialogHeader')} 
            <p>${localityText('geographyRequiredDialogMessage')}</p>
        </div>`).dialog({
            title: localityText('geographyRequiredDialogTitle'),
            close: function(){ $(this).remove(); }
        });
    },
    openGeoLocate: function(data) {

        if(document.getElementById('geolocate-dialog') !== null)
            return;

        const url = querystring.param("//www.geo-locate.org/web/webgeoreflight.aspx", data)
                  .replace(/%7c/gi, '|'); // GEOLocate doesn't like '|' to be uri escaped.

        const listener = evt => {
            if (/www\.geo-locate\.org$/.test(evt.origin)) this.gotGeoRef(evt.data);
        };

        window.addEventListener('message', listener, false);

        this.geoLocateDialog = $('<div id="geolocate-dialog">')
            .append($('<iframe>', {
                src: url,
                style: "width:908px; height:653px;",
                title: localityText('geoLocate'),
            }))
            .dialog({
                width: 'auto',
                resizable: false,
                title: localityText('geoLocate'),
                close: ()=>{
                    window.removeEventListener('message', listener, false);
                    this.geoLocateDialog.remove();
                    this.geoLocateDialog=undefined;
                }
            });
    },
    gotGeoRef: function(dataStr) {
        const [lat, long, uncertainty, poly] = dataStr.split('|');

        this.model.set({
            lat1text: lat,
            latitude1: parseFloat(lat),
            long1text: long,
            longitude1: parseFloat(long),
            latlongtype: "Point",
            // Presumably available in picklist.
            latlongmethod: localityText('geoLocate')
        });

        const uncertaintyParsed = uncertainty === 'Unavailable' ? null : parseFloat(uncertainty);
        const polyParsed = poly === 'Unavailable' ? null : poly;

        if (uncertaintyParsed != null || polyParsed != null) {
            this.model.rget('geocoorddetails').done(gcd => {
                if (gcd == null) {
                    gcd = new schema.models.GeoCoordDetail.Resource();
                    gcd.placeInSameHierarchy(this.model);
                    this.model.set('geocoorddetails', gcd);
                }
                gcd.set({
                    maxuncertaintyest: uncertaintyParsed,
                    maxuncertaintyestunit: uncertaintyParsed && "m",
                    errorpolygon: polyParsed
                });
            });
        }

        $('#geolocate-dialog').dialog('close');
    },
    geoRefData: function() {
        const currentLat = this.model.get('latitude1');
        const currentLon = this.model.get('longitude1');
        const name = this.model.get('localityname') ?? '';

        const point = (currentLat != null && currentLon != null) ? [currentLat, currentLon, name, ''] : null;

        const constructGeo = (geography, result) => Q
                  .all([geography.rget('parent', true), geography.rget('definitionitem', true)])
                  .spread((parent, geodef) => {
                      const level = geodef.get('name').toLowerCase();
                      if (['country', 'state', 'county'].includes(level)) {
                          result[level] = geography.get('name');
                      }
                      return parent == null ? result : constructGeo(parent, result);
                  });

        const uncertainty = point == null ? null : Q(this.model.rget('geocoorddetails', true))
                  .then(gcd => gcd == null ? '' : gcd.get('maxuncertaintyest'));

        const geography =  Q(this.model.rget('geography', true))
                  .then(geo => geo == null ? null : constructGeo(geo, {}));

        return Q.all([geography, uncertainty])
            .spread((geo, uncert) => {
                if (geo == null) return null;

                const data = Object.assign({
                    v: 1,
                    w: 900,
                    h: 400,
                    georef: 'run',
                    locality: this.model.get('localityname') ?? '',
                    tab: 'results'
                }, geo);

                if (point != null) {
                    data.points = [...point, uncert].map(v => v.toString().replace(/[|:]/g, ' ')).join('|');
                }
                return data;
            });
    }
}, { pluginsProvided: ['LocalityGeoRef'] });
