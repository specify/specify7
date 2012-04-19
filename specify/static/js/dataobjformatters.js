define([
    'jquery', 'specifyapi', 'whenall', 'uiformat',
    'text!/static/resources/dataobj_formatters.xml'
], function($, api, whenAll, uiformat, xml) {
    "use strict";
    var formatters = $.parseXML(xml);

    function dataobjformat(resource, formatter) {
        return !resource ? $.when(null) : resource.fetchIfNotPopulated().pipe(function() {
            formatter = formatter || resource.specifyModel.name;
            var sw = $('format[name="' + formatter + '"]', formatters).find('switch');
            // external dataobjFormatters not supported
            if (!sw.length || sw.find('external').length) return null;

            // doesn't support switch fields that are in child objects
            var fields = (sw.attr('field') ?
                          sw.find('fields[value="' + resource.get(sw.attr('field')) + '"]:first') :
                          sw.find('fields:first')).find('field');

            var deferreds = fields.map(function () {
                var field = $(this);
                var formatter = field.attr('formatter'); // hope it's not circular!
                var fieldName = field.text();
                var fetch = resource.rget(fieldName, true);
                return !formatter ? fetch : fetch.pipe(function(resource) {
                    return dataobjformat(resource, formatter);
                });
            });

            return whenAll(deferreds).pipe(function (fieldVals) {
                var result = [];
                fields.each(function (index) {
                    if (!fieldVals[index]) return;
                    var fieldNode = $(this);
                    fieldNode.attr('sep') && result.push(fieldNode.attr('sep'));

                    var format = fieldNode.attr('format');
                    if (!_(format).isUndefined() && format.trim() === '') return;
                    var field = resource.specifyModel.getField(fieldNode.text());
                    result.push(uiformat(field, fieldVals[index]));
                });
                return result.join('');
            });
        });
    }

    return dataobjformat;
});
