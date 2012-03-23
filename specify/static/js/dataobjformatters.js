define([
    'jquery', 'specifyapi',
    'text!/static/resources/dataobj_formatters.xml'
], function($, api, xml) {
    "use strict";
    var formatters = $.parseXML(xml), self = {};

    self.dataObjFormat = function (modelName, obj) {
        if (!obj) return obj;
        var sw = $('format[name="' + modelName + '"]', formatters).find('switch');
        // external dataobjFormatters not supported
        if (!sw.length || sw.find('external').length)
            return obj;

        function doIt(obj) {
            // doesn't support switch fields that are in child objects
            var fields = (sw.attr('field') ?
                          sw.find('fields[value="' + obj[sw.attr('field').toLowerCase()] + '"]').first() :
                          sw.find('fields').first()).find('field');

            var deferreds = fields.map(function () {
                return api.getDataFromResource(obj, $(this).text());
            });

            return $.when.apply($, deferreds).pipe(function () {
                var data = arguments, result = [];
                fields.each(function (index) {
                    var field = $(this);
                    field.attr('sep') && result.push(field.attr('sep'));
                    result.push(data[index]);
                });
                return result.join('');
            }).promise();
        }

        return ($.isPlainObject(obj)) ? doIt(obj) : $.get(obj).pipe(doIt)
    };

    return self;
});
