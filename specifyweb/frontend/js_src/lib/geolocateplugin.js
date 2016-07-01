"use strict";

const $ = require('jquery');
const _ = require('underscore');

const UIPlugin = require('./uiplugin.js');
const querystring = require('./querystring.js');
const schema = require('./schema.js');

module.exports =  UIPlugin.extend({
        __name__: "GeoLocatePlugin",
        events: {
            'click': 'click'
        },
        render: function() {
            if (this.model.specifyModel.name !== "Locality") {
                throw new Error("geolocateplugin can only be used with locality resources");
            }
            this.$el.attr('value', 'GEOLocate');
            return this;
        },
        click: function(evt) {
            evt.preventDefault();
            this.geoRefData().done(function(data) {
                data ? this.openGeoLocate(data) : this.geoRequired();
            }.bind(this));
        },
        geoRequired: function() {
            $('<div title="Geography Required">' +
              '<p><span class="ui-icon ui-icon-alert" style="display: inline-block;"></span>' +
              'The GeoLocate plugin requires the geography field to be populated.</p></div>'
             ).dialog({close: function(){ $(this).remove(); }});
        },
        openGeoLocate: function(data) {
            var url = querystring.param(
                "//www.museum.tulane.edu/geolocate/web/webgeoreflight.aspx", data);

            var listener = function(evt) {
                if (evt.origin === "http://www.museum.tulane.edu")
                    this.gotGeoRef(evt.data);
            }.bind(this);

            window.addEventListener('message', listener, false);

            $('<div id="geolocate-dialog">')
                .append($('<iframe>', {src: url, style: "width:908px; height:653px;"}))
                .dialog({
                    width: 'auto',
                    resizable: false,
                    title: 'GEOLocate',
                    close: function() {
                        window.removeEventListener('message', listener, false);
                        $(this).remove();
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
                latlongmethod: "GEOLocate" // Presumably available in picklist.
            });

            const uncertaintyParsed = uncertainty === 'Unavailable' ? null : parseFloat(uncertainty);
            const polyParsed = poly === 'Unavailable' ? null : poly;

            if (uncertaintyParsed != null || polyParsed != null) {
                this.model.rget('geocoorddetails').done(gcd => {
                    gcd && gcd.set({
                        maxuncertaintyest: uncertaintyParsed,
                        maxuncertaintyestunit: uncertaintyParsed && "m",
                        errorpolygon: polyParsed
                    });
                });
            }

            $('#geolocate-dialog').dialog('close');
        },
        geoRefData: function() {
            var data = {
                v: 1,
                w: 900,
                h: 400,
                georef: 'run',
                locality: this.model.get('localityname'),
                tab: 'results'
            };

            function travGeo(geo) {
                function recur(parent, geodef) {
                    var geoLevel = {
                        'Country': 'country',
                        'State': 'state',
                        'County': 'county'
                    }[geodef.get('name')];
                    geoLevel && (data[geoLevel] = geo.get('name'));

                    return parent ? travGeo(parent) : null;
                }
                return $.when(geo.rget('parent', true), geo.rget('definitionitem', true)).pipe(recur);
            }

            return $.when(this.model.rget('geography', true)).pipe(function(geo) {
                return geo ? travGeo(geo).pipe(function() { return data; }) : null;
            });
        }
    }, { pluginsProvided: ['LocalityGeoRef'] });

