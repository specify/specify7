"use strict";

import $ from 'jquery';
import _ from 'underscore';


import api from './api';
import * as latlongutils from './latlongutils';
import UIPlugin from './uiplugin';
import template from './templates/latlonui.html';
import localityText from './localization/locality';
import commonText from './locality/common';


export default UIPlugin.extend({
        __name__: "LatLongUI",
        initialize: function() {
            UIPlugin.prototype.initialize.apply(this, arguments);
            this.disabled = this.$el.prop('disabled');

            var events = _(["lat1text", "long1text", "lat2text", "long2text", "latlongtype"]).map(
                function(field) { return 'change:' + field; });

            this.model.on(events.join(" "), this.render, this);
        },
        render: function() {
            var self = this;
            var resource = this.model;

            resource.fetchIfNotPopulated().done(function() {
                var plugin = $(template({localityText, commonText}));
                var tbody = plugin.find('tbody');
                tbody.append(tbody.find('tr').clone().hide());
                tbody.find('input').each(function(i) {
                    var input = $(this);
                    var ptInx = Math.floor(i/2) + 1;
                    var interpreted = $(tbody.find('span')[i]);
                    var expectedType = ['Lat', 'Long'][i%2];
                    var fieldName = expectedType.toLowerCase() + ptInx + 'text';
                    var inferredField = ['latitude', 'longitude'][i%2] + ptInx;
                    input.keyup(function() {
                        var parsed = latlongutils[expectedType].parse(input.val());
                        input.data('parsed', parsed);
                        interpreted.text(
                            parsed ? parsed.format() : '???'
                        );
                    });
                    var value = resource.get(fieldName) || resource.get(inferredField);
                    input.val(value).keyup();
                    input.change(function() {
                        var parsed = input.data('parsed');
                        var attrs = {};
                        attrs[fieldName] = input.val();
                        if (input.val().trim() === '') {
                            attrs[inferredField]         = null;
                            attrs['srclatlongunit']      = null;
                            attrs['originallatlongunit'] = null;
                        } else if (parsed) {
                            attrs[inferredField]         = parsed.asFloat();
                            attrs['srclatlongunit']      = parsed.soCalledUnit();
                            attrs['originallatlongunit'] = parsed.soCalledUnit();
                        }
                        resource.set(attrs);
                    });
                    input.prop('disabled', self.disabled);
                });

                self.$el.replaceWith(plugin);
                self.setElement(plugin);

                var type = plugin.find('[name="type"]').prop('disabled', self.disabled);
                type.change(function() {
                    switch (type.val()) {
                    case 'Point':
                        tbody.find('tr').each(function(i) {
                            if (i === 0) $(this).show().find('th').text(localityText('coordinates'));
                            else $(this).hide();
                        });
                        break;
                    case 'Line':
                        tbody.find('tr').each(function(i) {
                            $(this).show().find('th').text([commonText('start'),commonText('end')][i]);
                        });
                        break;
                    case 'Rectangle':
                        tbody.find('tr').each(function(i) {
                            $(this).show().find('th').text([localityText('northWestCorner'), localityText('southEastCorner')][i]);
                        });
                        break;
                    }
                });
                resource.get('latlongtype') && type.val(resource.get('latlongtype')).change();
                type.change(function() { resource.set('latlongtype', type.val()); });
            });
            return this;
        }
    }, { pluginsProvided: ['LatLonUI'] });

