define([
    'jquery', 'underscore', 'specifyapi', 'latlongutils', 'uiplugin',
    'text!/static/html/templates/latlonui.html',
], function($, _, api, latlongutils, UIPlugin, latlonui_html) {
    "use strict";
    var template = _.template(latlonui_html);

    return UIPlugin.extend({
        render: function() {
            var resource = this.model;
            if (!resource.populated) {
                resource.fetchIfNotPopulated().done(_.bind(this.render, this));
                return this;
            }

            var init = this.init;

            var plugin = $(template());
            var tbody = plugin.find('tbody');
            tbody.append(tbody.find('tr').clone().hide());
            tbody.find('input').each(function(i) {
                var input = $(this), ptInx = Math.floor(i/2) + 1;
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
                var value = resource.get(fieldName);
                input.val(value).keyup();
                input.change(function() {
                    var parsed = input.data('parsed');
                    resource.set(fieldName, input.val());
                    parsed && resource.set(inferredField, parsed.asFloat());
                });
            });

            this.$el.replaceWith(plugin);
            this.setElement(plugin);

            var type = plugin.find('[name="type"]');
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
            return this;
        }
    });
});
