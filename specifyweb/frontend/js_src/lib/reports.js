"use strict";

import $ from 'jquery';
import _ from 'underscore';
import {Backbone} from './backbone';
import React from 'react';

import {Button} from './components/basic';
import {getModel, getModelById, schema} from './schema';
import {QueryLine} from './components/querybuilderfield';
import {AttachmentPlugin} from './components/attachmentplugin';
import {
    attachmentsAvailable,
    attachmentSettingsPromise,
    formatAttachmentUrl
} from './attachments';
import {userInformation} from './userinfo';
import {formsText} from './localization/forms';
import {commonText} from './localization/common';

import {csrfToken} from './csrftoken';
import {iconClassName, legacyNonJsxIcons} from './components/icons';
import {parseSpecifyProperties} from './parseformcells';
import {showDialog} from './components/legacydialog';
import {getRelatedObjectCount} from './resource';
import {hasPermission} from './permissions';
import {serializeResource} from './datamodelutils';
import {f} from './functools';
import {parseQueryFields} from './querybuilderutils';
import {getIcon, unknownIcon} from './icons';
import {createBackboneView} from './components/reactbackboneextend';

// TODO: rewrite to React
// TODO: add reports icon to dialogs
const AttachmentView = createBackboneView(AttachmentPlugin);
const QueryLineView = createBackboneView(QueryLine);

var title = commonText('reports');

var ReportListDialog = Backbone.View.extend({
    __name__: "ReportListDialog",
    events: {
        'click button.select': 'getReportUI',
    },
    initialize: function() {
        this.options.readOnly ||= !hasPermission('/report','execute');
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
    render(){
        attachmentSettingsPromise.then(()=>this._render());
        return this;
    },
    _render: function() {
        if (!(this.options.autoSelectSingle && this.reports.length + this.labels.length <= 1)) {
            var reports = $('<table class="reports grid-table grid-cols-[auto,1fr,auto] gap-1">');
            var labels = $('<table class="labels grid-table grid-cols-[auto,1fr,auto] gap-1">');

            reports.append.apply(reports, _.map(this.reports, this.makeEntry.bind(this, "/images/Reports16x16.png")));
            labels.append.apply(labels, _.map(this.labels, this.makeEntry.bind(this, "/images/Label16x16.png")));

            if(this.reports.length === 0)
                reports.append(`<p>${commonText('noResults')}</p>`);

            if(this.labels.length === 0)
                labels.append(`<p>${commonText('noResults')}</p>`);

            this.el.classList.add('flex', 'flex-col', 'gap-4');
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

            this.dialog?.remove();
            this.dialog = showDialog({
                header: title,
                onClose: () => {this.dialog.remove(); this.options.done?.() },
                buttons: commonText('close'),
                content: this.el,
            });
        } else
            this.options.done?.();
    },
    makeEntry: function(icon, appResource) {
        const img = $('<img>', {src: icon, class: iconClassName});
        const a = $(`<button
            type="button"
            class="select link"
            title="${appResource.get('remarks') || ""}"
        >${appResource.get('name')}</button>`);
        var entry = $('<tr>')
                .data('resource', appResource)
                .append($('<td>').append(img), $('<td>').append(a));

        if(!this.options.readOnly)
            entry.append(`<td><a
              class="icon"
              title="${commonText('edit')}"
              aria-label="${commonText('edit')}"
              href="/specify/appresources/${appResource.id}/"
          >${legacyNonJsxIcons.pencil}</a></td>`);
        return entry;
    },
    getReportUI: function(evt) {
        evt.preventDefault();
        var appResource = $(evt.currentTarget).closest('tr').data('resource');
        this.getReport(appResource, getReportParams);
    },
    getReport: function(appResource, action) {
        var reports = new schema.models.SpReport.LazyCollection({
            filters: { appresource: appResource.id }
        });
        var dataFetch = appResource.rget('spappresourcedatas', true);
        var reportOptions = this.options;
        Promise.all([dataFetch, reports.fetch({ limit: 1 })]).then(function([data]) {
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
            Promise.all([report.rget('query', true), fixupImages(reportXML)])
                .then(function([query, imageFixResult]) {
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
            .append(`<p>${formsText('reportsProblemsDialogText')}</p>`);
        var badImageExprs = this.imageFixResult.badImageExpressions;
        var missingAttachments = this.imageFixResult.missingAttachments;
        if (badImageExprs.length) {
            this.$el.append(`<b>${formsText('badImageExpressions')}<b>`);
            $('<ul role="list">').appendTo(this.el).append(
                _.map(badImageExprs, function(e) {return $('<li>').text(e)[0];}));
        }
        if (missingAttachments.length) {
            this.$el.append(`<b>${formsText('missingAttachments')}</b>`);
            $('<ul role="list" class="missing-attachments">').appendTo(this.el).append(
                _.map(missingAttachments, function(f) {
                    return $('<li>').append(
                        $(`<button
                            class="link"
                            title="${formsText('fix')}"
                            aria-label="${formsText('fix')}"
                        >`).text(f))[0];
                }));
        }
        this.dialog?.remove();
        this.dialog = showDialog({
            header: '',
            content: this.el,
            onClose: () => this.dialog.remove(),
            buttons: <>
                <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
                <Butotn.Orange onClick={()=>this.ignoreProblems()}>{commonText('ignore')}</Butotn.Orange>
            </>
        });
        return this;
    },
    ignoreProblems: function() {
        this.action(_({}).extend(this.reportResources, {reportXML: this.imageFixResult.reportXML}));
    },
    fixMissingAttachment: function(evt) {
        evt.preventDefault();

        var index = this.$('.missing-attachments button').index(evt.currentTarget);
        var attachmentPlugin = new AttachmentView({
            onUploadComplete: this.uploadComplete.bind(this, index),
        });
        this.dialog?.remove();
        this.dialog = showDialog({
            header: formsText('missingAttachmentsFixDialogTitle'),
            content: attachmentPlugin.render().$el,
            onClose: () => this.dialog.remove(),
            buttons: <>
                <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
            </>
        });
    },
    uploadComplete: function(index, attachment) {
        attachment.set('title', this.imageFixResult.missingAttachments[index]);
        var originalXML = this.reportResources.reportXML;
        attachment.save().then(function() { return fixupImages(originalXML); })
            .then(this.tryAgain.bind(this));
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
            parseInt(parseSpecifyProperties(reportResources.appResource.get('metadata')).tableid, 10);

    if (_.isNaN(contextTableId) || contextTableId === -1) {
        console.error("couldn't determine table id for report", reportResources.report.get('name'));
        return;
    }

    var recordSets = new schema.models.RecordSet.LazyCollection({
        filters: {
            specifyuser: userInformation.id,
            type: 0,
            domainfilter: true,
            dbtableid: contextTableId
        }
    });
    recordSets.fetch({ limit: 100 }).then(function() {
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
        newfield.set('columnalias', tblModel.idField.name);
        newfield.set('contexttableident', options.tblId);
        //newfield.set('createdbyagent', samplefield.get('createdbyagent'));
        newfield.set('endvalue', null);
        newfield.set('fieldname', tblModel.idField.name);
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
        newfield.set('stringid',options.tblId + '.' + tblModel.name.toLowerCase() + '.' + tblModel.idField.name);
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
        this.dialog?.remove();
        this.dialog = showDialog({
            header: formsText('reportParameters'),
            content: this.el,
            onClose: ()=>this.dialog.remove(),
            buttons: <>
                <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
                <Button.Green onClick={()=>this.done()}>{commonText('save')}</Button.Green>
            </>,
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
        this.dialog?.remove();
        this.dialog = showDialog({
            header: formsText('labelFromRecordSetDialogTitle'),
            onClose: () => this.dialog.remove(),
            buttons: this.dialogButtons(),
        });
        return this;
    },
    dialogEntry: function(recordSet) {
        const model = getModelById(recordSet.get('dbtableid'));
        const icon =  model.overrides.isSystem
            ? '/images/system.png'
            : getIcon(model.name.toLowerCase()) ?? unknownIcon
        const img = $('<img>', {src: icon, alt: model.label, class: iconClassName});
        var link = $(`<button class="link">${recordSet.get('name')}</button>`);
        var entry = $('<tr>').append(
            $('<td>').append(img),
            $('<td>').append(link),
            $('<td class="item-count" style="display:none">'));

        recordSet.get('remarks') && entry.find('button').attr('title', recordSet.get('remarks'));
        getRelatedObjectCount(recordSet, 'recordSetItems').then(function(count) {
            $('.item-count', entry).text('(' + count + ')').show();
        });
        return entry;
    },
    dialogButtons: function() {
        return <>
            <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
            {this.reportResources.query && <Button.Blue
              onClick={()=> new QueryParamsDialog({reportResources: reportResources}).render()}
            >{commonText('close')}</Button.Blue>}
        </>;
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
        this.model = getModel(this.query.get('contextname'));

        this.fieldUIs = parseQueryFields(serializeResource(this.query).fields)
          .map(field=>({...field, isDisplay: true}))
          .map((field, index)=>
              new QueryLineView({
                baseTableName: this.model.name,
                field,
                fieldHash: index.toString(),
                onChange: f.void,
                onMappingChange: f.void,
                onRemove: undefined,
                onOpen: f.void,
                onClose: f.void,
                onLineFocus: f.void,
                onMoveUp: undefined,
                onMoveDown: undefined,
                isFocused: false,
                openedElement: undefined,
                showHiddenFields: false,
                getMappedFields: ()=>[],
          })
      );
    },
    render: function() {
        this.$el.append('<ul role="list">');
        this.dialog?.remove();
        this.dialog = showDialog({
            header: this.query.get('name'),
            content: this.el,
            onClose: () => this.dialog.remove(),
            buttons: <>
                <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
                <Button.Blue onClick={()=>{this.dialog.remove(); this.runReport()}}>{formsText('runReport')}</Button.Blue>
            </>,
        });
        this.$('ul').append(this.fieldUIs.map(field=>field.render().el));
        return this;
    },
    runReport: function() {
        runReport(this.reportResources, this.recordSetId);
    }
});

function runReport(reportResources, recordSetId) {
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
                 `<input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}"/>` +
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
    return reportAttachments.fetch().then(function() {
        var byTitles = {};
        var missingAttachments = [];
        reportAttachments.each(function(a) { byTitles[a.get('title')] = a; });
        _.each(filenames, function(imageExprs, filename) {
            var attachment = byTitles[filename];
            var imageUrl;
            if (!attachment) {
                missingAttachments.push(filename);
                imageUrl = badImageUrl;
            } else
                imageUrl = attachmentsAvailable() ?
                    '"' + formatAttachmentUrl(serializeResource(attachment), undefined) + '"' :
                    badImageUrl;
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

    return appRs.fetch();
}

export function reports(options = {}) {
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

