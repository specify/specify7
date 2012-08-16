define([
    'jquery', 'underscore', 'cs!fieldformat'
], function($, _, fieldformat) {

    return function(resource, fieldName) {
        var field = resource.specifyModel.getField(fieldName);
        return resource.rget(fieldName).pipe(_.bind(fieldformat, this, field));
    };
});
