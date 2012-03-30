define([
    'jquery', 'underscore', 'schemalocalization', 'specifyapi', 'latlongutils',
    'text!/static/html/templates/gmapplugin.html',
    'text!/static/html/templates/latlonui.html'
], function($, _, schemalocalization, api, latlongutils, gmaptemplate_html, latlonui_html) {
    "use strict";
    var gmaptemplate = _.template(gmaptemplate_html);
    var latlonuitemplate = _.template(latlonui_html);

    return {
        PartialDateUI: function(control, init, resource) {
            control[0].type = 'text'; // this probably breaks IE (f*** you IE)
            control.val('');
            if (control.prop('disabled'))
                control.prop({disabled: false, readonly: true});
            else
                control.datepicker({dateFormat: $.datepicker.ISO_8601});
            var label = control.parents().last().find('label[for="' + control.prop('id') + '"]');
            if (!label.text()) {
                label.text(schemalocalization.getLocalizedLabelForField(init.df, resource.specifyModel));
            }
            if (resource) {
                control.change(function() { resource.set(init.df, control.val()); });
                return resource.rget(init.df).done(_.bind(control.val, control));
            }
        },
        WebLinkButton: function(control, init) {
            var form = control.closest('.specify-view-content');
            var watched = form.find(
                '#' + 'specify-field-' + form.prop('id').split('-').pop() + '-' + init.watch);
            switch(init.weblink) {
            case 'MailTo':
                control.click(function() {
                    var addr = watched.val();
                    addr && window.open('mailto:' + addr);
                });
                control.attr('value', 'EMail');
                break;
            }
        },
        LocalityGoogleEarth: function(control, init, resource) {
            control.replaceWith(gmaptemplate(resource.toJSON()));
        },
        LatLonUI: function(control, init, resource) {
            var plugin = $(latlonuitemplate());
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
            control.replaceWith(plugin);
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
        }
    };
});
