define(['jquery', 'text!resources/specify_datamodel.xml'], function($, xml) {
    "use strict";
    var dataModel = {};

    $('table', $.parseXML(xml)).each(function () {
        var table = $(this);
        dataModel[table.attr('classname').split('.').pop().toLowerCase()] = table;
    });

    var getDataModelField = function(modelName, fieldName) {
        var table = dataModel[modelName.toLowerCase()];
        if (!table) return $();
        var sel = 'field[name="'+ fieldName +'"], relationship[relationshipname="'+ fieldName + '"]';
        return table.find(sel).first();
    };

    var self = {
        getViewForModel: function(modelName) {
            return dataModel[modelName.toLowerCase()].find('display').attr('view');
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

        getRelatedFieldType: function(modelName, fieldName) {
            var field = getDataModelField(modelName, fieldName);
            if (!field.is('relationship'))
                throw new TypeError(fieldName + 'is not a related object field.');
            return field.attr('type');
        },

        getCannonicalNameForModel: function(modelName) {
            return dataModel[modelName.toLowerCase()].attr('classname').split('.').pop();
        }
    };

    return self;
});