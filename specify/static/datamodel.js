define(['jquery', 'text!resources/specify_datamodel.xml'], function($, xml) {
    "use strict";
    var dataModel = {};

    $('table', $.parseXML(xml)).each(function () {
        var table = $(this);
        dataModel[table.attr('classname').split('.').pop().toLowerCase()] = table;
    });

    return {
        getViewForModel: function(modelName) {
            return dataModel[modelName.toLowerCase()].find('display').attr('view');
        },

        getDataModelField: function(modelName, fieldName) {
            var table = dataModel[modelName.toLowerCase()];
            if (!table) return $();
            var sel = 'field[name="'+ fieldName +'"], relationship[relationshipname="'+ fieldName + '"]';
            return table.find(sel);
        },
    };
});