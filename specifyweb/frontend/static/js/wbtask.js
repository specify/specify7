define(['jquery', 'schema', 'specifyapi', 'wbview'], function($, schema, api, WBView) {
    "use strict";

    return function(app) {
        app.router.route('workbench/:id/', 'workbench', function(id) {
            var dialog = $('<div>Loading...</div>').dialog({
                title: 'Loading',
                modal: true,
                close: function() {$(this).remove();}
            });
            var wb = new schema.models.Workbench.Resource({id: id});
            $.when(
                wb.fetch(),
                $.get('/api/workbench/rows/' + id + '/')
            ).done(function(__, data) {
                app.setTitle("Workbench: " + wb.get('name'));
                app.setCurrentView(new WBView({ wb: wb, data: data[0] }));
            });
        });
    };
});
