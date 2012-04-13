define([
    'jquery', 'underscore',
    'text!/static/resources/specify_datamodel.xml'
], function($, _, xml) {
    "use strict";
    var dataModel = $.parseXML(xml);

    var allTables = $('table', dataModel);

    var allFields = function(table) {
        return table.find('field, relationship');
    };

    var findTable = function(name) {
        name = name.toLowerCase();
        return allTables.filter(function() {
            return $(this).attr('classname').split('.').pop().toLowerCase() === name;
        });
    };

    var getTableName = function(table) {
        return table.attr('classname').split('.').pop();
    };

    var getFieldName = function(field) {
        return field.attr('name') || field.attr('relationshipname');
    };

    var getDataModelField = function(modelName, fieldName) {
        var table = findTable(modelName), fieldName = fieldName.toLowerCase();
        return allFields(table).filter(function() {
            var field = $(this), name = getFieldName(field);
            return name && name.toLowerCase() === fieldName;
        });
    };

    var datamodel = {
        getAllModels: function() {
            return allTables.map(function() {
                return getTableName($(this));
            });
        },

        getAllFields: function(modelName) {
            return allFields(findTable(modelName)).map(function() {
                return getFieldName($(this));
            });
        },

        getViewForModel: function(modelName) {
            return findTable(modelName).find('display').attr('view');
        },

        getRelatedModelForField: function(modelName, fieldName) {
            var field = getDataModelField(modelName, fieldName);
            if (!field.is('relationship'))
                throw new TypeError(fieldName + ' is not a related object field.');
            return field.attr('classname').split('.').pop();
        },

        getFieldType: function(modelName, fieldName) {
            return getDataModelField(modelName, fieldName).attr('type');
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
                throw new TypeError(fieldName + ' is not a related object field.');
            return field.attr('type');
        },

        getFieldOtherSideName: function(modelName, fieldName) {
            var field = getDataModelField(modelName, fieldName);
            if (!field.is('relationship'))
                throw new TypeError(fieldName + ' is not a related object field.');
            return field.attr('othersidename');
        },

        getCannonicalNameForModel: function(modelName) {
            var table = findTable(modelName);
            return table.length ? getTableName(table) : null;
        }
    };

    return datamodel;
});