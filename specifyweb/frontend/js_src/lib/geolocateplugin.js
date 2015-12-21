"use strict";

var $ = require('jquery');
var _ = require('underscore');

var UIPlugin = require('./uiplugin.js');
var querystring = require('./querystring.js');

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
            var data = dataStr.split('|');

            this.model.set({
                lat1text: data[0],
                latitude1: data[0],
                long1text: data[1],
                longitude1: data[1],
                latlongtype: "Point",
                latlongmethod: "GEOLocate" // Presumably available in picklist.
            });

            $('#geolocate-dialog').dialog('close');
        },
        geoRefData: function() {
            var data = {
                v: 1,
                w: 900,
                h: 400,
                georef: 'run',
                locality: this.model.get('localityname') };

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

