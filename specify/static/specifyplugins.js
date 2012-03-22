define([
    'jquery', 'underscore', 'schemalocalization', 'specifyapi', 'latlongutils',
    'text!gmapplugin.html', 'text!latlonui.html'
], function($, _, schemalocalization, api, latlongutils, gmaptemplate_html, latlonui_html) {
    "use strict";
    var gmaptemplate = _.template(gmaptemplate_html);
    var latlonuitemplate = _.template(latlonui_html);

    return {
        PartialDateUI: function(control, init, data) {
            control[0].type = 'text'; // this probably breaks IE (f*** you IE)
            if (control.prop('disabled'))
                control.prop({disabled: false, readonly: true});
            else
                control.datepicker({dateFormat: $.datepicker.ISO_8601});
            var label = control.parents().last().find('label[for="' + control.prop('id') + '"]');
            if (!label.text()) {
                var model = control.closest('[data-specify-model]').attr('data-specify-model');
                label.text(schemalocalization.getLocalizedLabelForField(init.df, model));
            }
            if (data) {
                api.getDataFromResource(data, init.df).done(_.bind(control.val, control));
            } else { control.val(''); }
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
        LocalityGoogleEarth: function(control, init, data) {
            control.replaceWith(gmaptemplate(data));
        },
        LatLonUI: function(control, init, data) {
            var plugin = $(latlonuitemplate({id: _.uniqueId(control.prop('id'))}));
            var tbody = plugin.find('tbody');
            tbody.append(tbody.find('tr').clone().hide());
            tbody.find('input').each(function(i) {
                var input = $(this);
                var interpreted = $(tbody.find('span')[i]);
                var expectedType = ['Lat', 'Long'][i%2];
                input.keyup(function() {
                    var parsed = latlongutils[expectedType].parse(input.val());
                    input.data('parsed', parsed);
                    interpreted.text(
                        parsed ? parsed.format() : '???'
                    );
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
        }
    };
});