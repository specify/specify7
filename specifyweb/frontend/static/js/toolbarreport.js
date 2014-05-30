define([
    'require', 'jquery', 'underscore', 'backbone', 'schema', 'queryfield', 'parsespecifyproperties',
    'jquery-ui', 'jquery-bbq'
], function(require, $, _, Backbone, schema, QueryFieldUI, parsespecifyproperties) {
    "use strict";
    var app;

    var title =  "Reports";

    var dialog;
    var commonDialogOpts = {
        modal: true,
        close: function() { dialog = null; $(this).remove(); }
    };

    var dialogEntry = _.template('<li><a href="#"><img src="<%= icon %>">' +
                                 '<%= name %><span class="item-count" style="display:none"> - </span></a></li>');

    var ReportListDialog = Backbone.View.extend({
        __name__: "ReportListDialog",
        className: "reports-dialog list-dialog",
        events: {
            'click a': 'getReport'
        },
        render: function() {
            var reports = $('<ul>');
            var labels = $('<ul>');

            this.options.appResources.each(function(appResource) {
                var icon, ul;
                switch (appResource.get('mimetype').toLowerCase()) {
                case 'jrxml/report':
                    icon = "/images/Reports16x16.png";
                    ul = reports;
                    break;
                case 'jrxml/label':
                    icon = "/images/Label16x16.png";
                    ul = labels;
                    break;
                default:
                    console.warn('unknown report type:', report.get('mimetype'));
                    return;
                }
                var entry = $(dialogEntry({ name: appResource.get('name'), icon: icon, href: "" }));
                entry.find('a')
                    .data('resource', appResource)
                    .attr('title', appResource.get('remarks') || "");
                ul.append(entry);
            });
            this.$el
                .append("<h2>Reports</h2>").append(reports)
                .append("<h2>Labels</h2>").append(labels);

            this.options.appResources.isComplete() || this.$el.append('<p>(list truncated)</p>');

            this.$el.dialog(_.extend({}, commonDialogOpts, {
                title: title,
                maxHeight: 400,
                buttons: [
                    {text: 'Cancel', click: function() { $(this).dialog('close'); }}
                ]
            }));
            return this;
        },
        getReport: function(evt) {
            evt.preventDefault();
            var appResource = $(evt.currentTarget).data('resource');
            var reports = new schema.models.SpReport.LazyCollection({
                filters: {
                    specifyuser: app.user.id,
                    appresource: appResource.id
                }
            });

            var gotReport = this.gotReport.bind(this);
            reports.fetch({ limit: 1 }).done(function() {
                if (!reports.isComplete()) {
                    console.warn("found multiple report objects for appresource id:", resourceId);
                } else if (reports.length < 1) {
                    console.error("couldn't find report object for appresource id:", resourceId);
                    return;
                }
                reports.at(0).rget('query', true).done(function(query) {
                    gotReport(appResource, reports.at(0), query);
                });
            });
        },
        gotReport: function(appResource, report, query) {
            var contextTableId = query ? query.get('contexttableid') :
                    parseInt(
                        parsespecifyproperties(appResource.get('metadata')).tableid,
                        10);

            if (_.isNaN(contextTableId) || contextTableId === -1) {
                console.error("couldn't determine table id for report", report.get('name'));
                return;
            }

            var recordSets = new schema.models.RecordSet.LazyCollection({
                filters: {
                    // specifyuser: app.user.id,
                    dbtableid: contextTableId
                }
            });
            recordSets.fetch({ limit: 100 }).done(function() {
                dialog && dialog.$el.dialog('close');
                dialog = new ChooseRecordSetDialog({
                    recordSets: recordSets,
                    report: report,
                    query: query
                });
                $('body').append(dialog.el);
                dialog.render();
            });
        }});

    var ChooseRecordSetDialog = Backbone.View.extend({
        __name__: "ChooseRecordSetForReport",
        className: "recordset-for-report-dialog list-dialog",
        events: {
            'click a': 'selected'
        },
        initialize: function(options) {
            this.report = options.report;
            this.query = options.query;
            this.recordSets = options.recordSets;
        },
        render: function() {
            var ul = $('<ul>');
            this.recordSets.each(function(recordSet) {
                var icon = schema.getModelById(recordSet.get('dbtableid')).getIcon();
                var entry = $(dialogEntry({ icon: icon, name: recordSet.get('name') }));
                recordSet.get('remarks') && entry.find('a').attr('title', recordSet.get('remarks'));
                ul.append(entry);
                recordSet.getRelatedObjectCount('recordsetitems').done(function(count) {
                    $('.item-count', entry).append(count).show();
                });
            });
            this.recordSets.isComplete() || ul.append('<li>(list truncated)</li>');
            this.$el.append(ul);
            this.$el.dialog(_.extend({}, commonDialogOpts, {
                title: "From Record Set",
                maxHeight: 400,
                buttons: this.dialogButtons()
            }));
            return this;
        },
        dialogButtons: function() {
            var buttons = [{ text: 'Cancel', click: function() { $(this).dialog('close'); }}];

            if (this.query) {
                var queryParamsDialogOpts = { report: this.report, query: this.query };
                buttons.unshift({
                    text: 'Query',
                    click: function() {
                        $(this).dialog('close');
                        dialog = new QueryParamsDialog(queryParamsDialogOpts);
                        dialog.render();
                    }
                });
            }
            return buttons;
        },
        selected: function(evt) {
            evt.preventDefault();
            var recordSet = this.recordSets.at(this.$('a').index(evt.currentTarget));
            var url = $.param.querystring("/report_runner/run/", {
                reportId: this.report.id,
                recordSetId: recordSet.id });
            window.open(url);
            dialog && dialog.$el.dialog('close');
        }
    });

    var QueryParamsDialog = Backbone.View.extend({
        __name__: "QueryParamsDialog",
        initialize: function(options) {
            this.report = options.report;
            this.query = options.query;
            this.model = schema.getModel(this.query.get('contextname'));
        },
        render: function() {
            this.$el.append('<ul class="query-params-list">')
                .dialog(_.extend({}, commonDialogOpts, {
                    title: this.query.get('name'),
                    width: 800,
                    position: { my: "top", at: "top+20", of: $('body') }
                }));
            this.query.rget('fields').done(this.gotFields.bind(this));
            return this;
        },
        gotFields: function(spqueryfields) {
            this.fields = spqueryfields;
            this.fieldUIs = spqueryfields.map(this.makeFieldUI.bind(this));
            var ul = this.$('ul');
            ul.append.apply(ul, _.pluck(this.fieldUIs, 'el'));
        },
        makeFieldUI: function(spqueryfield) {
            return new QueryFieldUI({
                forReport: true,
                parentView: this,
                model: this.model,
                spqueryfield: spqueryfield,
                el: $('<li class="spqueryfield for-report">')
            }).render();
        }
    });

    return {
        task: 'report',
        title: title,
        icon: '/images/Reports32x32.png',
        execute: function() {
            if (dialog) return;
            app = require('specifyapp');
            var appRs = new schema.models.SpAppResource.LazyCollection({
                filters: {
                    specifyuser: app.user.id,
                    mimetype__startswith: "jrxml"
                }
            });
            appRs.fetch({ limit: 100 }).done(function() {
                dialog = new ReportListDialog({ appResources: appRs });
                $('body').append(dialog.el);
                dialog.render();
            });
        }
    };
});
