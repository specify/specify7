define([
    'jquery', 'specifyapi', 'whenall', 'cs!fieldformat',
    'text!resources/backstop/dataobj_formatters.xml'
], function($, api, whenAll, fieldformat, xml) {
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
                var fieldNode = $(this);
                var formatter = fieldNode.attr('formatter'); // hope it's not circular!
                var fieldName = fieldNode.text();
                return resource.rget(fieldName).pipe(function(value) {
                    return formatter ? dataobjformat(value, formatter) :
                        fieldformat(resource.specifyModel.getField(fieldName), value);
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
                    result.push(fieldVals[index]);
                });
                return result.join('');
            });
        });
    }

    return dataobjformat;
});
