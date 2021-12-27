"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import schema from './schema';
import QueryFieldUI from './queryfield';
import parsespecifyproperties from './parsespecifyproperties';
import AttachmentPlugin from './attachmentplugin';
import * as attachments from './attachments';
import userInfo from './userinfo';
import formsText from './localization/forms';
import commonText from './localization/common';

import csrftoken from './csrftoken';
import populateForm from './populateform';
import * as navigation from './navigation';

var title = commonText('reports');

var dialog;
function makeDialog(el, options) {
    dialog && dialog.dialog('close');
    var done = options.done;
    dialog = el.dialog(_.extend({
        modal: true,
        close: function() { dialog = null; $(this).remove(); done && done();}
    }, options));
}

var ReportListDialog = Backbone.View.extend({
    __name__: "ReportListDialog",
    className: "reports-dialog table-list-dialog",
    events: {
        'click button.select': 'getReportUI',
        'click button.edit': 'editReport',
    },
    initialize: function() {
        this.options.readOnly ||= !userInfo.isadmin;
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
        if (this.options.autoSelectSingle) {
            if (appResources.length == 1) {
                this.getReport(appResources.models[0], getReportParams);
            } else if (appResources.length == 0) {
                alert(formsText('noReportsAvailable')); //currently safe to assume a tableid was provided.
            }
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
        if (!(this.options.autoSelectSingle && this.reports.length + this.labels.length <= 1)) {
            var reports = $('<table class="reports">');
            var labels = $('<table class="labels">');

            reports.append.apply(reports, _.map(this.reports, this.makeEntry.bind(this, "/images/Reports16x16.png")));
            labels.append.apply(labels, _.map(this.labels, this.makeEntry.bind(this, "/images/Label16x16.png")));

            if(this.reports.length === 0)
                reports.append(`<p>${commonText('noResults')}</p>`);

            if(this.labels.length === 0)
                labels.append(`<p>${commonText('noResults')}</p>`);

            this.$el
                .append(
                    $('<section>')
                        .append(`<h2>${commonText('reports')}</h2>`)
                        .append($('<nav>').append(reports))
                )
                .append(
                    $('<section>')
                        .append(`<h2>${commonText('labels')}</h2>`)
                        .append($('<nav>').append(labels))
                );

            if(!this.options.appResources.isComplete())
                this.$el.append(`<p>${commonText('listTruncated')}</p>`);

            const that = this;
            makeDialog(this.$el, {
                title: title,
                maxHeight: 400,
                buttons: [{
                    text: commonText('close'),
                    click: function() {
                        $(this).dialog('close');
                        that.options.onClose?.();
                    }
                }],
                done: this.options.done
            });
        } else {
            this.options.done && this.options.done();
        }
        return this;
    },
    makeEntry: function(icon, appResource) {
        const img = $('<img>', {src: icon});
        const a = $(`<button
            type="button"
            class="select fake-link"
            title="${appResource.get('remarks') || ""}"
        >${appResource.get('name')}</button>`);
        var entry = $('<tr>')
                .data('resource', appResource)
                .append($('<td>').append(img), $('<td>').append(a));

        if(!this.options.readOnly)
            entry.append(`<button
                type="button"
                class="edit ui-icon ui-icon-pencil fake-link"
            >${commonText('edit')}</button>`);
        return entry;
    },
    getReportUI: function(evt) {
        evt.preventDefault();
        var appResource = $(evt.currentTarget).closest('tr').data('resource');
        this.getReport(appResource, getReportParams);
    },
    editReport(evt) {
        evt.preventDefault();
        const appResource = $(evt.currentTarget).closest('tr').data('resource');
        navigation.go(`/specify/appresources/${appResource.id}/`);
    },
    getReport: function(appResource, action) {
        var reports = new schema.models.SpReport.LazyCollection({
            filters: { appresource: appResource.id }
        });
        var dataFetch = appResource.rget('spappresourcedatas', true);
        var reportOptions = this.options;
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
            const report = reports.at(0);
            const appResourceData = data.at(0);
            const reportXML = appResourceData.get('data');
            $.when(report.rget('query', true), fixupImages(reportXML))
                .done(function(query, imageFixResult) {
                    var reportResources = {
                        appResource: appResource,
                        report: report,
                        appResourceData: appResourceData,
                        reportXML: reportXML,
                        query: query,
                        reportOptions: reportOptions
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
        this.$el.attr('title', formsText('reportProblemsDialogTitle'))
            .append(`<p>${formsText('reportsProblemsDialogMessage')}</p>`);
        var badImageExprs = this.imageFixResult.badImageExpressions;
        var missingAttachments = this.imageFixResult.missingAttachments;
        if (badImageExprs.length) {
            this.$el.append(`<b>${formsText('badImageExpressions')}<b>`);
            $('<ul>').appendTo(this.el).append(
                _.map(badImageExprs, function(e) {return $('<li>').text(e)[0];}));
        }
        if (missingAttachments.length) {
            this.$el.append(`<b>${formsText('missingAttachments')}</b>`);
            $('<ul class="missing-attachments">').appendTo(this.el).append(
                _.map(missingAttachments, function(f) {
                    return $('<li>').append(
                        $(`<button
                            class="fake-link"
                            title="${formsText('fix')}"
                            aria-label="${formsText('fix')}"
                        >`).text(f))[0];
                }));
        }
        makeDialog(this.$el, {
            buttons: [{text: commonText('ignore'), click: this.ignoreProblems.bind(this)},
                      {text: commonText('cancel'), click: function() { $(this).dialog('close'); }}]
        });
        return this;
    },
    ignoreProblems: function() {
        this.action(_({}).extend(this.reportResources, {reportXML: this.imageFixResult.reportXML}));
    },
    fixMissingAttachment: function(evt) {
        evt.preventDefault();
        if (!attachments) return;

        var index = this.$('.missing-attachments button').index(evt.currentTarget);
        var attachmentPlugin = new AttachmentPlugin({populateForm: populateForm});
        makeDialog(attachmentPlugin.render().$el, {
            title: formsText('missingAttachmentsFixDialogTitle')
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

function getReportParams(reportResources) {
    var reportDOM = $.parseXML(reportResources.reportXML);
    var parameters = $('parameter[isForPrompting="true"]', reportDOM);
    if (parameters.length < 1) {
        if (reportResources.reportOptions.recordToPrintId) {
            runReportForRecord(_.extend({parameters: {}}, reportResources));
        } else {
            getRecordSets(_.extend({parameters: {}}, reportResources));
        }
    } else {
        new ReportParametersDialog({reportResources: reportResources, parameters: parameters}).render();
    }
}

function runReportForRecord(reportResources) {
    // for consistency's sake since we set all fields to isdisplay in QueryParamsDialog
    reportResources.query.dependentResources.fields.each((f) => f.set('isdisplay', true));

    clearQueryFilters(reportResources);
    addRecordIdFilterToQuery(reportResources);
    runReport(reportResources);
}

function addRecordIdFilterToQuery(reportResources) {
    var queryResource = reportResources.query;
    if (queryResource) {
        var options = reportResources.reportOptions;
        var newfield = new schema.models.SpQueryField.Resource();
        var samplefield = queryResource.dependentResources.fields.models[0];
        var tblModel = _.find(schema.models, function(m) {return m.tableId == options.tblId;}); 
        //newfield.set('allownulls', null);
        newfield.set('alwaysfilter', false);
        newfield.set('columnalias', tblModel.idFieldName);
        newfield.set('contexttableident', options.tblId);
        //newfield.set('createdbyagent', samplefield.get('createdbyagent'));
        newfield.set('endvalue', null);
        newfield.set('fieldname', tblModel.idFieldName);
        newfield.set('formatname', null);
        //newfield.set('id', -1);
        newfield.set('isdisplay', false);
        newfield.set('isnot', false);
        newfield.set('isprompt', false);
        newfield.set('isrelfld', false);
        //newfield.set('mappings', null);
        //newfield.set('modifiedbyagent', samplefield.get('modifiedbyagent'));
        newfield.set('operend', null);
        newfield.set('operstart',1);
        newfield.set('position', queryResource.dependentResources.fields.length);
        newfield.set('query', samplefield.get('query'));
        //newfield.set('resource_uri', null);
        newfield.set('sorttype', 0);
        newfield.set('startvalue', options.recordToPrintId.toString());
        newfield.set('stringid',options.tblId + '.' + tblModel.name.toLowerCase() + '.' + tblModel.idFieldName);
        newfield.set('tablelist', options.tblId);
        //newfield.set('timestampcreated', samplefield.get('timestampcreated'));
        //newfield.set('timestampmodified', samplefield.get('timestampmodified'));
        //newfield.set('version', 0);
        queryResource.dependentResources.fields.models.push(newfield);
        queryResource.dependentResources.fields.length++;
    }    
}

function clearQueryFilters(reportResources) {
    var queryResource = reportResources.query;
    if (queryResource) {
        _.each(queryResource.dependentResources.fields.models, function(f) {
            if (!f.get('alwaysfilter')) {
                f.set('operstart',1);
                f.set('operend',null);
                f.set('startvalue','');
                f.set('endvalue',null);
            }
        });
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
                $('<th>', {scope: 'col'}).text($(param).attr('name')),
                $('<td><input type="text" autocomplete="on" spellcheck="true"></td>'))[0];
        });
        $('<table>').append(rows).appendTo(this.el);
        makeDialog(this.$el, {
            title: formsText('reportParameters'),
            buttons: [
                {text: commonText('save'), click: this.done.bind(this)},
                {text: commonText('cancel'), click: function() { $(this).dialog('close'); }}
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
            table.append(`<tr><td></td><td>${commonText('listTruncated')}</td></tr>`);
        this.$el.append(table);
        makeDialog(this.$el, {
            title: formsText('labelFromRecordSetDialogTitle'),
            maxHeight: 400,
            buttons: this.dialogButtons()
        });
        return this;
    },
    dialogEntry: function(recordSet) {
        const model = schema.getModelById(recordSet.get('dbtableid'));
        const icon = model.getIcon();
        const img = $('<img>', {src: icon, alt: model.getLocalizedName()});
        var link = $(`<button class="fake-link">${recordSet.get('name')}</button>`);
        var entry = $('<tr>').append(
            $('<td>').append(img),
            $('<td>').append(link),
            $('<td class="item-count" style="display:none">'));

        recordSet.get('remarks') && entry.find('button').attr('title', recordSet.get('remarks'));
        recordSet.getRelatedObjectCount('recordsetitems').done(function(count) {
            $('.item-count', entry).text('(' + count + ')').show();
        });
        return entry;
    },
    dialogButtons: function() {
        var buttons = [{ text: commonText('cancel'), click: function() { $(this).dialog('close'); }}];
        var reportResources = this.reportResources;
        if (reportResources.query) {
            buttons.unshift({
                text: commonText('query'),
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
                {text: formsText('runReport'), click: this.runReport.bind(this)},
                {text: commonText('cancel'), click: function() { $(this).dialog('close'); }}
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

function runReport(reportResources, recordSetId, _fieldUIs) {
    dialog && dialog.dialog('close');
    var query = reportResources.query;
    if (_.isFunction(query.set)) {
        query.set('limit', 0);
        query.set('recordsetid', recordSetId);
    } else {
        // Not sure if this branch is needed.
        // Only for the case that query is a raw JS object
        // rather than a Backbone resource object.
        query.limit = 0;
        query.recordsetid = recordSetId;
    }

    var reportWindowContext = "ReportWindow" + Math.random();
    window.open("", reportWindowContext);
    var form = $('<form action="/report_runner/run/" method="post" ' +
                 'style="display: none;" ' +
                 'target="' + reportWindowContext + '">' +
                 `<input type="hidden" name="csrfmiddlewaretoken" value="${csrftoken}"/>` +
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
    var badImageUrl = `"${window.location.origin}/images/unknown.png"`;
    var badImageExpressions = [];
    var filenames = {};
    $('imageExpression', reportDOM).each(function() {
        if ($(this).hasClass('java.net.URL')) return;

        var imageExpression = $(this).text();
        var match = imageExpression.match(/\$P\{\s*RPT_IMAGE_DIR\s*\}\s*\+\s*"\/"\s*\+\s*"(.*?)"/);
        if (match) {
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
                imageUrl = attachments.systemAvailable() ?
                    '"' + attachments.originalURL(attachment.get('attachmentlocation')) + '"' :
                    badImageUrl;
            }
            _.each(imageExprs, function(e) { e.text(imageUrl); });
        });
        return {
            isOK: badImageExpressions.length === 0 && missingAttachments.length === 0,
            reportXML: new XMLSerializer().serializeToString(reportDOM),
            badImageExpressions: badImageExpressions,
            missingAttachments: missingAttachments
        };
    });
}

function getAppResources(options){
    const appRs = new schema.models.SpAppResource.LazyCollection();

    if (_(options).has('tblId'))
        appRs.url = () => `/report_runner/get_reports_by_tbl/${options.tblId}/`;
    else
        appRs.url = () => "/report_runner/get_reports/";

    return new Promise((resolve) =>
        appRs
            .fetch()
            .done(() =>
                resolve(appRs)
            )
    )
}

export default function reports(options = {}) {
    return getAppResources(options).then((appResources) =>
        new ReportListDialog(_.extend(options, {appResources}))
    )
}

export const ReportsView = Backbone.View.extend({
    __name__: 'ReportsWrapper',
    render(){
        reports(this.options).then(view=>{this.view = view; view.render()})
        return this;
    },
    remove(){
        this.view.remove();
        Backbone.View.prototype.remove.call(this);
    }
});

