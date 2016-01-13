"use strict";

var $ = require('jquery');
var _ = require('underscore');


var api = require('./specifyapi.js');
var latlongutils = require('./latlongutils.js');
var UIPlugin = require('./uiplugin.js');
var template = require('./templates/latlonui.html');


module.exports =  UIPlugin.extend({
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
                var plugin = $(template());
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
                        resource.set(fieldName, input.val());
                        if (parsed) {
                            resource.set(inferredField, parsed.asFloat());
                            resource.set('originallatlongunit', parsed.soCalledUnit());
                        }
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
                            if (i === 0) $(this).show().find('th').text('Coords');
                            else $(this).hide();
                        });
                        break;
                    case 'Line':
                        tbody.find('tr').each(function(i) {
                            $(this).show().find('th').text(['Start', 'End'][i]);
                        });
                        break;
                    case 'Rectangle':
                        tbody.find('tr').each(function(i) {
                            $(this).show().find('th').text(['NW Corner', 'SE Corner'][i]);
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

