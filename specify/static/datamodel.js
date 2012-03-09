(function (specify, $, undefined) {
    "use strict";
    if (specify.datamodel) return;
    var dataModel, self = specify.datamodel = {};

    self.getViewForModel = function(modelName) {
        return dataModel[modelName.toLowerCase()].find('display').attr('view');
    };

    self.getDataModelField = function(modelName, fieldName) {
        var table = dataModel[modelName.toLowerCase()];
        if (!table) return $();
        var sel = 'field[name="'+ fieldName +'"], relationship[relationshipname="'+ fieldName + '"]';
        return table.find(sel);
    };

    var breakOutModels = function(dataModelDOM) {
        if (dataModel) return;
        dataModel = {};
        $(dataModelDOM).find('table').each(function () {
            var table = $(this);
            dataModel[table.attr('classname').split('.').pop().toLowerCase()] = table;
        });
    }

    specify.addInitializer(function() {
        return $.get('/static/resources/specify_datamodel.xml', breakOutModels).promise();
    });

} (window.specify, jQuery));
