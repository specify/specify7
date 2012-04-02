define([
    'jquery',
    'text!/static/resources/specify_datamodel.xml'
], function($, xml) {
    "use strict";
    var dataModel = $.parseXML(xml);

    var findTable = function(name) {
        name = name.toLowerCase();
        return $('table', dataModel).filter(function() {
            return $(this).attr('classname').split('.').pop().toLowerCase() === name;
        });
    };

    var getDataModelField = function(modelName, fieldName) {
        var table = findTable(modelName), fieldName = fieldName.toLowerCase();
        return table.find('field, relationship').filter(function() {
            var field = $(this), name = field.attr('name') || field.attr('relationshipname');
            return name && name.toLowerCase() === fieldName;
        });
    };

    var self = {
        getViewForModel: function(modelName) {
            return findTable(modelName).find('display').attr('view');
        },

        getRelatedModelForField: function(modelName, fieldName) {
            var field = getDataModelField(modelName, fieldName);
            if (!field.is('relationship'))
                throw new TypeError(fieldName + 'is not a related object field.');
            return field.attr('classname').split('.').pop();
        },

        isRelatedField: function(modelName, fieldName) {
            return getDataModelField(modelName, fieldName).is('relationship');
        },

        isRequiredField: function(modelName, fieldName) {
            return getDataModelField(modelName, fieldName).attr('required') === 'true';
        },

        getRelatedFieldType: function(modelName, fieldName) {
            var field = getDataModelField(modelName, fieldName);
            if (!field.is('relationship'))
                throw new TypeError(fieldName + 'is not a related object field.');
            return field.attr('type');
        },

        getCannonicalNameForModel: function(modelName) {
            var table = findTable(modelName);
            return table.length ? table.attr('classname').split('.').pop() : null;
        }
    };

    return self;
});