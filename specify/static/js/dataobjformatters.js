define([
    'jquery', 'specifyapi',
    'text!/static/resources/dataobj_formatters.xml'
], function($, api, xml) {
    "use strict";
    var formatters = $.parseXML(xml), self = {};

    self.dataObjFormat = function (resource) {
        if (!resource) return resource;
        var sw = $('format[name="' + resource.specifyModel + '"]', formatters).find('switch');
        // external dataobjFormatters not supported
        if (!sw.length || sw.find('external').length) return resource;

        // doesn't support switch fields that are in child objects
        var fields = (sw.attr('field') ?
                      sw.find('fields[value="' + resource.get(sw.attr('field')) + '"]:first') :
                      sw.find('fields:first')).find('field');

        var deferreds = fields.map(function () {
            return resource.rget($(this).text());
        });

        return api.whenAll(deferreds).pipe(function (data) {
            var result = [];
            fields.each(function (index) {
                var field = $(this);
                field.attr('sep') && result.push(field.attr('sep'));
                result.push(data[index]);
            });
            return result.join('');
        });
    };

    return self;
});
