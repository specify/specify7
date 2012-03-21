define(
    ['jquery', 'underscore', 'schemalocalization', 'specifyapi', 'text!gmapplugin.html', 'text!latlonui.html'],
    function($, _, schemalocalization, api, gmaptemplate_html, latlonui_html) {
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
                control.replaceWith(plugin);

                var type = plugin.find('.specifyplugin-latlonui-type');
                var pointIndex = plugin.find('.specifyplugin-latlonui-point-index');
                var format = plugin.find('[name="format"]');

                type.buttonset();
                pointIndex.buttonset();

                format.change(function() {
                    var select = $(this);
                    switch (select.val()) {
                    case 'Decimal Degrees':
                        $('[name="degrees"]', plugin).css('width', '6em')
                            .next().nextAll().hide();
                        break;
                    case 'Degrees Minutes Decimal Seconds':
                        $('[name="degrees"]', plugin).css('width', '3em')
                            .nextAll().show();
                        $('[name="minutes"]', plugin).css('width', '3em');
                        $('[name="seconds"]', plugin).css('width', '6em');
                        break;
                    case 'Degrees Decimal Minutes':
                        $('[name="degrees"]', plugin).css('width', '3em')
                            .nextAll().show();
                        $('[name="minutes"]', plugin).css('width', '6em')
                            .next().nextAll().hide();
                        break;
                    }
                });
                format.val('Degrees Minutes Decimal Seconds').change();

                type.find(':radio').change(function() {
                    var radio = $(this);
                    if (radio.val() === 'point') {
                        pointIndex.hide();
                    } else {
                        pointIndex.show();
                    }
                });
                type.find('[value="point"]').prop('checked', true).change();

                var coords = [[data.lat1text, data.long1text], [data.lat2text, data.long2text]];
                plugin.find('[name="source"]').each(function(i) {
                    $(this).val(coords[0][i]);
                });
            }
        };
    });