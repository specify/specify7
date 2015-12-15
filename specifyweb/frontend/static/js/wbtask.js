define(['jquery', 'q', 'schema', 'wbview', 'router', 'specifyapp'], function($, Q, schema, WBView, router, app) {
    "use strict";

    return function() {
        router.route('workbench/:id/', 'workbench', function(id) {
            var dialog = $('<div><div class="progress-bar"></div></div>').dialog({
                title: 'Loading',
                modal: true,
                close: function() {$(this).remove();}
            });
            $('.progress-bar', dialog).progressbar({value: false});
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
