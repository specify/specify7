define([
    'require', 'jquery', 'underscore', 'backbone', 'schema', 'queryfield', 'parsespecifyproperties',
    'whenall', 'dataobjformatters', 'fieldformat',
    'text!context/report_runner_status.json!noinline',
    'jquery-ui', 'jquery-bbq'
], function(
    require, $, _, Backbone, schema, QueryFieldUI, parsespecifyproperties,
    whenAll, dataobjformatters, fieldformat,
    statusJSON
) {
    "use strict";
    var objformat = dataobjformatters.format, aggregate = dataobjformatters.aggregate;

    var app;
    var status = $.parseJSON(statusJSON);
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
            var dataFetch = appResource.rget('spappresourcedatas', true);

            var gotReport = this.gotReport.bind(this);
            $.when(dataFetch, reports.fetch({ limit: 1 })).done(function(data) {
                if (data.length > 1) {
                    console.warn("found multiple report definitions for appresource id:", resourceId);
                } else if (data.length < 1) {
                    console.error("coundn't find report definition for appresource id:", resourceId);
                    return;
                }
                if (!reports.isComplete()) {
                    console.warn("found multiple report objects for appresource id:", resourceId);
                } else if (reports.length < 1) {
                    console.error("couldn't find report object for appresource id:", resourceId);
                    return;
                }
                reports.at(0).rget('query', true).done(function(query) {
                    var report = reports.at(0);
                    report.XML = data.at(0).get('data');
                    gotReport(appResource, report, query);
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
                var queryParamsDialogOpts = {
                    report: this.report,
                    query: this.query
                };
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
            dialog && dialog.$el.dialog('close');
            var recordSet = this.recordSets.at(this.$('a').index(evt.currentTarget));
            (new QueryParamsDialog({
                report: this.report,
                query: this.query,
                recordSetId: recordSet.id
            })).runQuery();
        }
    });

    var QueryParamsDialog = Backbone.View.extend({
        __name__: "QueryParamsDialog",
        initialize: function(options) {
            this.report = options.report;
            this.query = options.query;
            this.recordSetId = options.recordSetId;
            this.model = schema.getModel(this.query.get('contextname'));

            var makeFieldUI = (function(spqueryfield) {
                return new QueryFieldUI({
                    forReport: true,
                    parentView: this,
                    model: this.model,
                    spqueryfield: spqueryfield,
                    el: $('<li class="spqueryfield for-report">')
                });
            }).bind(this);

            this.fieldUIsP = this.query.rget('fields').pipe(function(spqueryfields) {
                spqueryfields.each(function(field) { field.set('isdisplay', true); });
                return spqueryfields.map(makeFieldUI);
            });
        },
        render: function() {
            this.$el.append('<ul class="query-params-list">')
                .dialog(_.extend({}, commonDialogOpts, {
                    title: this.query.get('name'),
                    width: 800,
                    position: { my: "top", at: "top+20", of: $('body') },
                    buttons: [
                        {text: "Run", click: this.runQuery.bind(this)},
                        {text: "Cancel", click: function() { $(this).dialog('close'); }}
                    ]
                }));
            var ul = this.$('ul');
            this.fieldUIsP.done(function(fieldUIs) {
                _.invoke(fieldUIs, 'render');
                ul.append.apply(ul, _.pluck(fieldUIs, 'el'));
            });
            return this;
        },
        runQuery: function() {
            dialog && dialog.$el.dialog('close');
            this.fieldUIsP.done(runQuery.bind(null, this.report, this.recordSetId, this.query));
        }
    });


    function runQuery(report, recordSetId, spQuery, fieldUIs) {
        var query = spQuery.toJSON();
        query.limit = 0;
        query.recordsetid = recordSetId;
        $.post('/stored_query/ephemeral/', JSON.stringify(query)).done(runReport.bind(null, report, fieldUIs));
    }


    function runReport(report, fieldUIs, queryResults) {
        var fields = ['id'].concat(_.map(fieldUIs, function(fieldUI) { return fieldUI.spqueryfield.get('stringid'); }));
        var reportXML = report.XML;
        formatResults(fieldUIs, queryResults.results).done(function(formattedData) {
            var form = $('<form action="http://localhost:8080/report" method="post" target="_blank">' +
                         '<textarea name="report"></textarea>' +
                         '<textarea name="data"></textarea>' +
                         '<input type="submit"/>' +
                         '</form>')
                    .appendTo('body');

            var reportData = {
                fields: fields,
                rows: formattedData
            };
            $('textarea[name="report"]', form).val(reportXML);
            $('textarea[name="data"]', form).val(JSON.stringify(reportData, null, 2));
            form[0].submit();
            form.remove();
        });
    }

    function formatResults(fieldUIs, rows) {
        function formatRow(row) {
            return whenAll( _.map(row, function(datum, i) {
                if (i === 0) return datum; // id field
                if (datum == null) return null;
                var fieldSpec = fieldUIs[i-1].fieldSpec;
                var field = fieldSpec.getField();
                if (field.type === "java.lang.Boolean") return !!datum;
                if (field.type === "java.lang.Integer") return datum;
                if (fieldSpec.treeRank || !field.isRelationship) {
                    if (field && (!fieldSpec.datePart || fieldSpec.datePart == 'Full Date')) {
                        return fieldformat(field, datum);
                    } else return datum;
                }
                switch (field.type) {
                case 'many-to-one':
                    return objformat(new (field.getRelatedModel().Resource)({ id: datum }));
                case 'one-to-many':
                    return (new field.model.Resource({ id: datum })).rget(field.name, true).pipe(aggregate);
                default:
                    console.error('unhandled field type:', field.type);
                    return datum;
                }
            }));
        }
        return whenAll( _.map(rows, formatRow) );
    }

    return {
        task: 'report',
        title: title,
        icon: '/images/Reports32x32.png',
        disabled: !status.available,
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
