define(['jquery', 'specifyapi', 'wbview'], function($, api, WBView) {
    "use strict";

    return function(app) {
        app.router.route('workbench/:id/', 'workbench', function(id) {
            var dialog = $('<div>Loading...</div>').dialog({
                title: 'Loading',
                modal: true,
                close: function() {$(this).remove();}
            });
            $.get('/api/workbench/rows/' + id + '/').done(function(data) {
                app.setCurrentView(new WBView({ wbid: id, data: data }));
                dialog.dialog('close');
            });
        });
    };
});
