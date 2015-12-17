"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var schema                 = require('./schema.js');
var QueryFieldUI           = require('./queryfield.js');
var parsespecifyproperties = require('./parsespecifyproperties.js');
var AttachmentPlugin       = require('./attachmentplugin.js');
var attachments            = require('./attachments.js');
var userInfo               = require('./userinfo.js');

    var title =  "Reports";

    var dialog;
    function makeDialog(el, options) {
        dialog && dialog.dialog('close');
        dialog = el.dialog(_.extend({
            modal: true,
            close: function() { dialog = null; $(this).remove(); }
        }, options));
    }

    var ReportListDialog = Backbone.View.extend({
        __name__: "ReportListDialog",
        className: "reports-dialog table-list-dialog",
        events: {
            'click a': 'getReportUI'
        },
        initialize: function(options) {
            var appResources = this.options.appResources;
            if (this.options.metaDataFilter) {
                var mdFilter = this.options.metaDataFilter;
                appResources = appResources.filter(function(r) {
                    var md = r.get('metadata').toLowerCase().split(';');
                    for (var i=0; i < md.length; i++) {
                        var mdum = md[i].split('=');
                        if (mdum[0] === mdFilter.prop && mdum[1] === mdFilter.val) {
                            return true;
                        }
                    }
                    return false;
                });
            }
            if (this.options.autoSelectSingle && appResources.length == 1) {
                this.getReport(appResources[0], getReportParams);
            }
            function byType(type) {
                return appResources.filter(function(r) {
                    return r.get('mimetype').toLowerCase() === type;
                });
            }
            this.reports = byType('jrxml/report');
            this.labels = byType('jrxml/label');
        },
        render: function() {
            if (!(this.options.autoSelectSingle && this.reports.length + this.labels.length == 1)) {
                var reports = $('<table class="reports">');
                var labels = $('<table class="labels">');

                reports.append.apply(reports, _.map(this.reports, this.makeEntry.bind(this, "/images/Reports16x16.png")));
                labels.append.apply(labels, _.map(this.labels, this.makeEntry.bind(this, "/images/Label16x16.png")));

                this.$el
                    .append("<h2>Reports</h2>").append(reports)
                    .append("<h2>Labels</h2>").append(labels);

                this.options.appResources.isComplete() || this.$el.append('<p>(list truncated)</p>');

                makeDialog(this.$el, {
                    title: title,
                    maxHeight: 400,
                    buttons: [
                        {text: 'Cancel', click: function() { $(this).dialog('close'); }}
                    ]
                });
            }
            return this;
        },
        makeEntry: function(icon, appResource) {
            var img = $('<img>', {src: icon});
            var a = $('<a class="select">')
                    .text(appResource.get('name'))
                    .attr('title', appResource.get('remarks') || "");
            var entry = $('<tr>')
                    .data('resource', appResource)
                    .append($('<td>').append(img), $('<td>').append(a));

            //this.options.readOnly || entry.append('<a class="edit ui-icon ui-icon-pencil">edit</a>');
            return entry;
        },
        getReportUI: function(evt) {
            evt.preventDefault();
            var appResource = $(evt.currentTarget).closest('tr').data('resource');
            var action = $(evt.currentTarget).hasClass('edit') ? editReport : getReportParams;
            this.getReport(appResource, action);
        },
        getReport: function(appResource, action) {
            var reports = new schema.models.SpReport.LazyCollection({
                filters: { appresource: appResource.id }
            });
            var dataFetch = appResource.rget('spappresourcedatas', true);

            $.when(dataFetch, reports.fetch({ limit: 1 })).done(function(data) {
                if (data.length > 1) {
                    console.warn("found multiple report definitions for appresource id:", appResource.id);
                } else if (data.length < 1) {
                    console.error("couldn't find report definition for appresource id:", appResource.id);
                    return;
                }
                if (!reports.isComplete()) {
                    console.warn("found multiple report objects for appresource id:", appResource.id);
                } else if (reports.length < 1) {
                    console.error("couldn't find report object for appresource id:", appResource.id);
                    return;
                }
                var report = reports.at(0);
                var reportXML = data.at(0).get('data');
                $.when(report.rget('query', true), fixupImages(reportXML))
                    .done(function(query, imageFixResult) {
                        var reportResources = {
                            appResource: appResource,
                            report: report,
                            reportXML: reportXML,
                            query: query
                        };
                        if (imageFixResult.isOK) {
                            action(_({}).extend(reportResources, {reportXML: imageFixResult.reportXML}));
                        } else new FixImagesDialog({
                            reportResources: reportResources,
                            imageFixResult: imageFixResult,
                            action: action
                        }).render();
                    });
            });
        }
    });

    var FixImagesDialog = Backbone.View.extend({
        __name__: "FixImagesDialog",
        events: {
            'click .missing-attachments a': 'fixMissingAttachment'
        },
        initialize: function(options) {
            this.reportResources = options.reportResources;
            this.imageFixResult = options.imageFixResult;
            this.action = options.action;
        },
        render: function() {
            this.$el.attr('title', "Problems with report")
                .append('<p>The selected report has the following problems:</p>');
            var badImageExprs = this.imageFixResult.badImageExpressions;
            var missingAttachments = this.imageFixResult.missingAttachments;
            if (badImageExprs.length) {
                this.$el.append('<b>Bad Image Expressions<b>');
                $('<ul>').appendTo(this.el).append(
                    _.map(badImageExprs, function(e) {return $('<li>').text(e)[0];}));
            }
            if (missingAttachments.length) {
                this.$el.append('<b>Missing attachments</b>');
                $('<ul class="missing-attachments">').appendTo(this.el).append(
                    _.map(missingAttachments, function(f) {
                        return $('<li>').append($('<a href="#" title="Fix.">').text(f))[0];
                    }));
            }
            makeDialog(this.$el, {
                buttons: [{text: "Ignore", click: this.ignoreProblems.bind(this)},
                          {text: "Cancel", click: function() { $(this).dialog('close'); }}]
            });
            return this;
        },
        ignoreProblems: function() {
            this.action(_({}).extend(this.reportResources, {reportXML: this.imageFixResult.reportXML}));
        },
        fixMissingAttachment: function(evt) {
            evt.preventDefault();
            if (!attachments) return;

            var index = this.$('.missing-attachments a').index(evt.currentTarget);
            var attachmentPlugin = new AttachmentPlugin();
            makeDialog(attachmentPlugin.render().$el, {
                title: "Choose file"
            });
            attachmentPlugin.on('uploadcomplete', this.uploadComplete.bind(this, index));
        },
        uploadComplete: function(index, attachment) {
            attachment.set('title', this.imageFixResult.missingAttachments[index]);
            var originalXML = this.reportResources.reportXML;
            attachment.save().pipe(function() { return fixupImages(originalXML); })
                .done(this.tryAgain.bind(this));
        },
        tryAgain: function(imageFixResult) {
            if (imageFixResult.isOK) {
                this.action(_({}).extend(this.reportResources, {reportXML: imageFixResult.reportXML}));
            } else new FixImagesDialog({
                reportResources: this.reportResources,
                imageFixResult: imageFixResult,
                action: this.action
            }).render();
        }
    });

    function getRecordSets(reportResources) {
        var contextTableId = reportResources.query ? reportResources.query.get('contexttableid') :
                parseInt(parsespecifyproperties(reportResources.appResource.get('metadata')).tableid, 10);

        if (_.isNaN(contextTableId) || contextTableId === -1) {
            console.error("couldn't determine table id for report", reportResources.report.get('name'));
            return;
        }

        var recordSets = new schema.models.RecordSet.LazyCollection({
            filters: {
                specifyuser: userInfo.id,
                type: 0,
                domainfilter: true,
                dbtableid: contextTableId
            }
        });
        recordSets.fetch({ limit: 100 }).done(function() {
            if (recordSets._totalCount > 0) {
                new ChooseRecordSetDialog({
                    recordSets: recordSets,
                    reportResources: reportResources
                }).render();
            } else {
                new QueryParamsDialog({reportResources: reportResources}).render();
            }
        });
    }

    function editReport(reportResources) {
        makeDialog($('<div title="Report definition">')
                   .append($('<textarea cols=120 rows=40 readonly>')
                           .text(reportResources.reportXML)),
                   {width: 'auto'});
    }

    function getReportParams(reportResources) {
        var reportDOM = $.parseXML(reportResources.reportXML);
        var parameters = $('parameter[isForPrompting="true"]', reportDOM);
        if (parameters.length < 1) {
            getRecordSets(_.extend({parameters: {}}, reportResources));
        } else {
            new ReportParametersDialog({reportResources: reportResources, parameters: parameters}).render();
        }
    }

    var ReportParametersDialog = Backbone.View.extend({
        __name__: "ReportParametersDialog",
        className: "report-parameters-dialog",
        initialize: function(options) {
            this.reportResources = options.reportResources;
            this.parameters = options.parameters;
        },
        render: function() {
            var rows = _.map(this.parameters, function(param) {
                return $('<tr>').append(
                    $('<th>').text($(param).attr('name')),
                    $('<td><input type="text"></td>'))[0];
            });
            $('<table>').append(rows).appendTo(this.el);
            makeDialog(this.$el, {
                title: "Report Parameters",
                buttons: [
                    {text: 'Ok', click: this.done.bind(this)},
                    {text: 'Cancel', click: function() { $(this).dialog('close'); }}
                ]
            });
            return this;
        },
        done: function() {
            var paramNames = _.map(this.parameters, function(param) { return $(param).attr('name'); });
            var paramValues = _.map(this.$('input'), function(input) { return $(input).val(); });
            getRecordSets(_.extend({parameters: _.object(paramNames, paramValues)}, this.reportResources));
        }
    });

    var ChooseRecordSetDialog = Backbone.View.extend({
        __name__: "ChooseRecordSetForReport",
        className: "recordset-for-report-dialog table-list-dialog",
        events: {
            'click a': 'selected'
        },
        initialize: function(options) {
            this.reportResources = options.reportResources;
            this.recordSets = options.recordSets;
        },
        render: function() {
            var table = $('<table>');
            table.append.apply(table, this.recordSets.map(this.dialogEntry, this));
            this.recordSets.isComplete() ||
                table.append('<tr><td></td><td>(list truncated)</td></tr>');
            this.$el.append(table);
            makeDialog(this.$el, {
                title: "From Record Set",
                maxHeight: 400,
                buttons: this.dialogButtons()
            });
            return this;
        },
        dialogEntry: function(recordSet) {
            var icon = schema.getModelById(recordSet.get('dbtableid')).getIcon();
            var img = $('<img>', {src: icon});
            var link = $('<a href="#">').text(recordSet.get('name'));
            var entry = $('<tr>').append(
                $('<td>').append(img),
                $('<td>').append(link),
                $('<td class="item-count" style="display:none">'));

            recordSet.get('remarks') && entry.find('a').attr('title', recordSet.get('remarks'));
            recordSet.getRelatedObjectCount('recordsetitems').done(function(count) {
                $('.item-count', entry).text('(' + count + ')').show();
            });
            return entry;
        },
        dialogButtons: function() {
            var buttons = [{ text: 'Cancel', click: function() { $(this).dialog('close'); }}];
            var reportResources = this.reportResources;
            if (reportResources.query) {
                buttons.unshift({
                    text: 'Query',
                    click: function() {
                        new QueryParamsDialog({reportResources: reportResources}).render();
                    }
                });
            }
            return buttons;
        },
        selected: function(evt) {
            evt.preventDefault();
            var recordSet = this.recordSets.at(this.$('a').index(evt.currentTarget));
            new QueryParamsDialog({
                reportResources: this.reportResources,
                recordSetId: recordSet.id
            }).runReport();
        }
    });

    var QueryParamsDialog = Backbone.View.extend({
        __name__: "QueryParamsDialog",
        initialize: function(options) {
            this.reportResources = options.reportResources;
            this.query = this.reportResources.query;
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
            this.$el.append('<ul class="query-params-list">');
            makeDialog(this.$el, {
                    title: this.query.get('name'),
                    width: 800,
                    position: { my: "top", at: "top+20", of: $('body') },
                    buttons: [
                        {text: "Run", click: this.runReport.bind(this)},
                        {text: "Cancel", click: function() { $(this).dialog('close'); }}
                    ]
            });
            var ul = this.$('ul');
            this.fieldUIsP.done(function(fieldUIs) {
                _.invoke(fieldUIs, 'render');
                ul.append.apply(ul, _.pluck(fieldUIs, 'el'));
            });
            return this;
        },
        runReport: function() {
            var runReportWithFields = runReport.bind(null, this.reportResources, this.recordSetId);
            this.fieldUIsP.done(runReportWithFields);
        }
    });

    function runReport(reportResources, recordSetId, fieldUIs) {
        dialog && dialog.dialog('close');
        var query = reportResources.query.toJSON();
        query.limit = 0;
        query.recordsetid = recordSetId;

        var reportWindowContext = "ReportWindow" + Math.random();
        window.open("", reportWindowContext);
        var form = $('<form action="/report_runner/run/" method="post" ' +
                     'style="display: none;" ' +
                     'target="' + reportWindowContext + '">' +
                     '<textarea name="report"></textarea>' +
                     '<textarea name="query"></textarea>' +
                     '<textarea name="parameters"></textarea>' +
                     '<input type="submit"/>' +
                     '</form>');
        $('textarea[name="report"]', form).val(reportResources.reportXML);
        $('textarea[name="query"]', form).val(JSON.stringify(query));
        $('textarea[name="parameters"]', form).val(JSON.stringify(reportResources.parameters));
        $('body').append(form);
        form[0].submit();
        _.defer(function () { form.remove(); });
    }

    function fixupImages(reportXML) {
        var reportDOM = $.parseXML(reportXML);
        var badImageUrl = '"http://' + window.location.host + '/images/unknown.png"';
        var badImageExpressions = [];
        var filenames = {};
        $('imageExpression', reportDOM).each(function() {
            var imageExpression = $(this).text();
            if (imageExpression.match(/^it\.businesslogic\.ireport\.barcode\.BcImage\.getBarcodeImage/)) return;
            var match = imageExpression.match(/\$P\{\s*RPT_IMAGE_DIR\s*\}\s*\+\s*"\/"\s*\+\s*"(.*?)"/);
            if (!match) {
                badImageExpressions.push(imageExpression);
                $(this).text(badImageUrl);
            } else {
                filenames[match[1]] ? filenames[match[1]].push($(this)) : (filenames[match[1]] = [$(this)]);
            }
        });
        var titles = _.keys(filenames).join(',');
        var reportAttachments = new schema.models.Attachment.LazyCollection({ filters: {title__in: titles}});
        return reportAttachments.fetch().pipe(function() {
            var byTitles = {};
            var missingAttachments = [];
            reportAttachments.each(function(a) { byTitles[a.get('title')] = a; });
            _.each(filenames, function(imageExprs, filename) {
                var attachment = byTitles[filename];
                var imageUrl;
                if (!attachment) {
                    missingAttachments.push(filename);
                    imageUrl = badImageUrl;
                } else {
                    imageUrl = '"' + attachments.originalURL(attachment.get('attachmentlocation')) + '"';
                }
                _.each(imageExprs, function(e) { e.text(imageUrl); });
            });
            return {
                isOK: badImageExpressions.length === 0 && missingAttachments === 0,
                reportXML: new XMLSerializer().serializeToString(reportDOM),
                badImageExpressions: badImageExpressions,
                missingAttachments: missingAttachments
            };
        });
    }

module.exports =  function(options) {
        options || (options = {});
        var appRs = new schema.models.SpAppResource.LazyCollection();
        appRs.url = () => "/report_runner/get_reports" +
            (_(options).has('tblId') ? "_by_tbl/" + options.tblId : "") + "/";
        appRs.fetch({ limit: 100 }).done(function() {
            new ReportListDialog(_.extend(options, { appResources: appRs})).render();
        });
    };

