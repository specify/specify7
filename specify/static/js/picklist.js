define(['jquery', 'underscore', 'schemalocalization', 'specifyapi'], function($, _, schemalocalization, api) {

    return function(control, resource) {
        var model = control.parents('[data-specify-model]').attr('data-specify-model');
        var field = control.attr('name');
        function buildPicklist(picklistitems, value) {
            var items = {};
            if (!control.hasClass('required')) {
                $('<option>').appendTo(control);
            }
            _(picklistitems).each(function(item) {
                $('<option>').text(item.title).attr('value', item.value).appendTo(control);
            });
            if (_(value).isUndefined()) return;
            var valueNotInItems = (value !== '') && _.all(picklistitems, function(item) { return item.value !== value; });
            var valueIsRequiredButMissing = control.is('.specify-required-field') && value === '';
            if (valueNotInItems || valueIsRequiredButMissing) {
                $('<option>').appendTo(control).attr('value', value).text(value + " (current value not in picklist)");
            }
            control.val(value);
        }

        resource && control.change(function() {
            resource.set(field, control.val());
        });

        if (model.toLowerCase() === 'agent' && field.toLowerCase() === 'agenttype') {
            buildPicklist([{value: 0, title: 'Organization'},
                           {value: 1, title: 'Person'},
                           {value: 2, title: 'Other'},
                           {value: 3, title: 'Group'}],
                          resource && resource.get('agenttype'));
            return;
        }

        var pickListName = schemalocalization.getPickListForField(field, model);
        if (!pickListName) { return; }
        var getPickList = api.getPickListByName(pickListName).pipe(function(picklist) {
            if (picklist.get('tablename')) {
                var picklistCol = new (api.Collection.forModel(picklist.get('tablename')))();
                return picklistCol.fetch().pipe(function () {
                    return picklistCol.map(function (item) {
                        return {value: item.get('resource_uri'), title: item.get('name')};
                    });
                });
            } else return picklist.get('picklistitems');
        });
        var getValue = resource ? resource.get(field) : null;
        return $.when(getPickList, getValue).done(buildPicklist);
    };
});
