define([
    'jquery', 'underscore', 'uiplugin', 'jquery-bbq'
], function($, _, UIPlugin) {
    "use strict";

    return UIPlugin.extend({
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
            var self = this;
            evt.preventDefault();
            self.geoRefData().done(function(data) {
                var url = $.param.querystring(
                    "//www.museum.tulane.edu/geolocate/web/webgeoreflight.aspx", data);

                var listener = function(evt) {
                    if (evt.origin === "http://www.museum.tulane.edu")
                        self.gotGeoRef(evt.data);
                };

                window.addEventListener('message', listener, false);

                $('<div id="geolocate-dialog">')
                    .append($('<iframe>', {src: url, style: "width:908px; height:653px;"}))
                    .dialog({
                        width: 'auto',
                        title: 'GEOLocate',
                        close: function() {
                            window.removeEventListener('message', listener, false);
                            $(this).remove();
                        }
                    });
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
            var self = this;
            var data = {
                v: 1,
                w: 900,
                h: 400,
                georef: 'run',
                locality: self.model.get('localityname') };

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

            return $.when(self.model.rget('geography', true)).pipe(travGeo).pipe(function() { return data; });
        }
    });
});
