define([
    'jquery', 'underscore', 'specifyapi', 'latlongutils',
    'text!/static/html/templates/gmapplugin.html',
    'text!/static/html/templates/latlonui.html',
    'text!/static/html/templates/partialdateui.html',
    'partialdate'
], function($, _, api, latlongutils, gmaptemplate_html, latlonui_html, partialdateui_html) {
    "use strict";
    var gmaptemplate = _.template(gmaptemplate_html);
    var latlonuitemplate = _.template(latlonui_html);
    var partialdateuitemplate = _.template(partialdateui_html);

    var partialDateFormats = [null, 'yy-mm-dd', 'yy-mm', 'yy'];

    return {
        PartialDateUI: function(control, init, resource) {
            var disabled = control.prop('disabled');
            var ui = $(partialdateuitemplate());
            var input = ui.find('input');
            var select = ui.find('select');
            input.prop('id', control.prop('id'));

            control.replaceWith(ui);
            ui.find('select, input').prop('readonly', disabled);

            disabled || input.datepicker({dateFormat: $.datepicker.ISO_8601});
            disabled && select.hide();

            var label = ui.parents().last().find('label[for="' + input.prop('id') + '"]');
            label.text() || label.text(resource.specifyModel.getField(init.df).getLocalizedName());

            if (resource) {
                input.change(function() {
                    resource.set(init.df, input.val());
                });

                select.change(function() {
                    resource.set(init.tp, select.val());
                });

                resource.on('change:' + init.df.toLowerCase(), function() {
                    input.val(resource.get(init.df));
                });

                resource.on('change:' + init.tp.toLowerCase(), function() {
                    var precision = resource.get(init.tp);
                    var format = partialDateFormats[precision];
                    format && input.datepicker('option', 'dateFormat', format);
                    select.val(precision);
                });

                return $.when(
                    resource.rget(init.df).done(_.bind(input.val, input)),
                    resource.rget(init.tp).done(function(precision) {
                        select.val(precision);
                        var format = partialDateFormats[precision];
                        format && input.datepicker('option', 'dateFormat', format);
                    }));
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
