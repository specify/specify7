define(['jquery', 'q', 'schema', 'wbview'], function($, Q, schema, WBView) {
    "use strict";

    return function(app) {
        app.router.route('workbench/:id/', 'workbench', function(id) {
            $('<div>Loading...</div>').dialog({
                title: 'Loading',
                modal: true,
                close: function() {$(this).remove();}
            });
            var wb = new schema.models.Workbench.Resource({id: id});
            Q.all([
                Q(wb.fetch()),
                Q($.get('/api/workbench/rows/' + id + '/'))
            ]).spread(function(__, data) {
                app.setTitle("Workbench: " + wb.get('name'));
                app.setCurrentView(new WBView({ wb: wb, data: data }));
            }).catch(app.handleError);
        });
    };
});
