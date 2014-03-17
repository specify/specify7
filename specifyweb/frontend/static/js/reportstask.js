define([
    'jquery', 'underscore', 'backbone', 'schema'
], function($, _, Backbone, schema) {
    "use strict";

    var ReportView = Backbone.View.extend({
        __name__: "ReportView",
        events: {
        },
        
    });

    return function(app) {
        app.router.route('report/:resourceId/', 'report', function(resourceId) {
            var reports = new schema.models.SpReport.LazyCollection({
                filters: {
                    //specifyuser: app.user.id,
                    appresource: resourceId
                }
            });
            reports.fetch({ limit: 1 }).fail(app.handleError).done(function() {
                if (reports._totalCount > 1) {
                    console.warn("found multiple report objects for appresource id:", resourceId);
                }
                if (reports.length === 0) {
                    console.error("couldn't find report object for appresource id:", resourceId);
                }
                app.setCurrentView(new ReportView({ model: reports.at(0) }));
            });
        });
    };
});
