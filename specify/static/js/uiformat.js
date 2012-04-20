define([
    'jquery', 'underscore'
], function($, _) {
    function parseDecInt(val) { return parseInt(val, 10); }

    var formatters = {
        'java.lang.Integer': parseDecInt,
        'java.lang.Short': parseDecInt,
        'java.math.BigDecimal': parseDecInt
    };

    return function(resource, fieldName) {
        var field = resource.specifyModel.getField(fieldName);
        if (field.model.name === 'CollectionObject' && field.name === 'catalogNumber') {
            return resource.rget('collection.catalogNumFormatName').pipe(function(catNumForm) {
                if (catNumForm === 'CatalogNumberNumeric') return parseDecInt(resource.get('catalogNumber'));
                else return resource.get('catalogNumber');
            });
        }

        var formatter = formatters[field.type];
        var fetch = resource.rget(fieldName);

        return fetch.pipe(function(value) {
            if(_(['timestampModified', 'timestampCreated']).contains(field.name)) {
                return value && value.split('T').shift();
            }
            return formatter ? formatter(value) : value;
        });
    };
});
