"use strict";

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');

var schema             = require('./schema.js');
var QueryFieldUI       = require('./queryfield.js');
var template           = require('./templates/querybuilder.html');
var userInfo           = require('./userinfo').default;
var app                = require('./specifyapp.js');
var queryFromTree      = require('./queryfromtree.js');
var navigation         = require('./navigation.js');
var QueryResultsTable  = require('./queryresultstable.js');
var EditResourceDialog = require('./editresourcedialog.js');
var QuerySaveDialog    = require('./querysavedialog.js');
var router             = require('./router.js');
const queryText = require('./localization/query').default;
const commonText = require('./localization/common').default;

    var QueryBuilder = Backbone.View.extend({
        __name__: "QueryBuilder",
        className: "query-view content-shadow-full-width",
        events: {
            'change :checkbox': 'optionChanged',
            'click .query-execute': 'search',
            'click .query-csv': 'searchDownload',
            'click .query-kml': 'searchDownload',
            'click .query-to-recordset': 'makeRecordSet',
            'click .query-save': 'save',
            'click .query-save-as': 'saveAs',
            'click .field-add': 'addField',
            'click .abandon-changes': 'abandonChanges'
        },
        initialize: function(options) {
            this.query = options.query;
            this.readOnly = options.readOnly;
            this.recordSet = options.recordSet;
            this.model = schema.getModel(this.query.get('contextname'));
        },
        title(){
            return queryText('queryTaskTitle')(this.query.get('name'));
        },
        render: function() {
            const title = this.recordSet ?
                queryText('queryRecordSetTitle')(
                    this.query.get('name'),
                    this.recordSet.get('name')
                )
                : queryText('queryTaskTitle')(this.query.get('name'));
            this.$el.append(template({ queryText, commonText, cid: this.cid }));
            this.$('.querybuilder-header h2').text(title);
            this.$('.querybuilder-header img').attr('src', this.model.getIcon()).attr('alt',this.model.getLocalizedName());
            this.query.isNew() && this.$('.abandon-changes').remove();
            this.readOnly && this.$('.query-save, .query-to-recordset, .query-save-as').remove();
            this.query.id == null && this.$('.query-save-as').remove();
            this.query.get('specifyuser') === userInfo.resource_uri || this.$('.query-save').remove();

            this.$('button.field-add').button({
                icons: { primary: 'ui-icon-plus' }, text: false
            });

            this.query.on('saverequired', this.saveRequired, this);

            this.query.rget('fields').done(this.gotFields.bind(this));

            this.$('input[name="selectDistinct"]').prop('checked', this.query.get('selectdistinct'));
            this.$('input[name="countOnly"]').prop('checked', this.query.get('countonly'));
            this.$('input[name="formatAudits"]').prop('checked', this.query.get('formatauditrecids'));
            //only visible for spauditlog queries
            this.$('input[name="formatAudits"]').prop('hidden', this.query.get('contexttableid') != 530);
            this.$('label.formatAuditsLabel').prop('hidden', this.query.get('contexttableid') != 530);


            return this;
        },
        gotFields: function(spqueryfields) {
            this.fields = spqueryfields;
            this.fieldUIs = spqueryfields.map(this.addFieldUI.bind(this));
            var ul = this.$('.spqueryfields');
            ul.append.apply(ul, _.pluck(this.fieldUIs, 'el'));
            ul.sortable({ update: this.updatePositions.bind(this) });
        },
        addFieldUI: function(spqueryfield) {
            this.$('.query-execute, .query-csv, .query-kml, .query-to-recordset').prop('disabled', false);
            return new QueryFieldUI({
                parentView: this,
                model: this.model,
                spqueryfield: spqueryfield,
                el: $('<li class="spqueryfield">')
            }).render();
        },
        removeFieldUI: function(ui, spqueryfield) {
            this.fieldUIs = _(this.fieldUIs).without(ui);
            this.fields.remove(spqueryfield);
            this.updatePositions();
            (this.fieldUIs.length < 1) && this.$('.query-execute, .query-csv, .query-kml, .query-save, .query-to-recordset').prop('disabled', true);
        },
        updatePositions: function() {
            _.invoke(this.fieldUIs, 'positionChanged');
        },
        contractFields: function() {
            _.each(this.fieldUIs, function(field) { field.expandToggle('hide'); });
        },
        deleteIncompleteFields: function(continuation) {
            const incomplete = this.fieldUIs.filter(f => f.isIncomplete());
            if (incomplete.length < 1) {
                continuation();
                return;
            }

            const dialog = $(`<div>
                ${queryText('queryDeleteIncompleteDialogHeader')}
                <p>${queryText('queryDeleteIncompleteDialogMessage')}</p>
            </div>`).dialog({
                title: queryText('queryDeleteIncompleteDialogTitle'),
                modal: true,
                close(){ $(this).remove(); },
                buttons: {
                    [commonText('remove')]() { doIt(); },
                    [commonText('cancel')]() { $(this).dialog('close'); }
                }
            });

            const doIt = () => {
                dialog.dialog('close');
                _.invoke(this.fieldUIs, 'deleteIfIncomplete');
                continuation();
            };
        },
        saveRequired: function() {
            this.$('.abandon-changes, .query-save').prop('disabled', false);
            navigation.addUnloadProtect(
                this,
                queryText('queryUnloadProtectDialogMessage')
            );
        },
        abandonChanges: function() {
            navigation.removeUnloadProtect(this);
            this.trigger('redisplay');
        },
        save() {
            this.save_({clone: false});
        },
        saveAs() {
            this.save_({clone: true});
        },
        save_: function({clone}) {
            if (this.readOnly) return;
            this.deleteIncompleteFields(() => {
                if (this.fieldUIs.length < 1) return;
                new QuerySaveDialog({
                    queryBuilder: this,
                    clone: clone
                }).render();
            });
        },
        addField: function() {
            var newField = new schema.models.SpQueryField.Resource();
            newField.set({
                sorttype: 0,
                isdisplay: true,
                isnot: false,
                startvalue: '',
                query: this.query.url()
            });
            this.fields.add(newField);

            var ui = this.addFieldUI(newField);
            this.fieldUIs.push(ui);
            this.$('.spqueryfields').append(ui.el).sortable('refresh');
            this.updatePositions();
        },
        makeRecordSet: function() {
            this.deleteIncompleteFields(() => this.makeRecordSet_());
        },
        makeRecordSet_: function() {
            if (this.fieldUIs.length < 1) return;

            var dialog = $(`<div>
                ${queryText('recordSetToQueryDialogHeader')}
                <p>${queryText('recordSetToQueryDialogMessage')}</p>
                <div class="progress" />
            </div>`).dialog({
                title: queryText('recordSetToQueryDialogTitle'),
                modal: true,
                autoOpen: false,
                close: function() { $(this).remove(); }
            });
            $('.progress', dialog).progressbar({ value: false });

            var recordset = new schema.models.RecordSet.Resource();
            recordset.set('dbtableid', this.model.tableId);
            recordset.set('fromQuery', this.query.toJSON());
            recordset.url = '/stored_query/make_recordset/';
            new EditResourceDialog({resource: recordset}).render()
                .on('saving', function() { dialog.dialog('open'); })
                .on('savecomplete', function() {
                    dialog.html(`
                        ${queryText('recordSetCreatedDialogHeader')}
                        <p>${queryText('recordSetCreatedDialogMessage')}</p>
                    `)
                        .dialog('option','title', queryText('recordSetCreatedDialogTitle'))
                        .dialog('option', 'buttons', [
                            {text: commonText('no'), click: function() { $(this).dialog('close'); }},
                            {text: commonText('open'), click: function() {
                                navigation.go('/specify/recordset/' + recordset.id + '/');
                            }},
                        ]);
                });
        },
        search: function(event) {
            event.preventDefault();
            this.$('.query-execute, .query-csv, .query-kml').blur();
            this.deleteIncompleteFields(() => this.search_());
        },

        hasGeoCoords: function() {
            var lat = false, lng = false, latt = false, lngt = false;
            this.fieldUIs.forEach(function(f){
                if (f.spqueryfield.get('isdisplay') && f.spqueryfield.get('tablelist').split(',').pop() == 2) {
                    var fld = f.spqueryfield.get('fieldname').toLowerCase();
                    lat = lat || fld === 'latitude1';
                    lng = lng || fld === 'longitude1';
                    //latt = latt || fld === 'lat1text';
                    //lngt = lngt || fld === 'long1text';
                }
            });
            return (lat && lng) || (latt && lngt);
        },

        searchDownload: function(evt) {
            this.$('.query-execute, .query-csv, .query-kml').blur();
            const isCsv = evt.currentTarget.classList.contains('query-csv');
            var postUrl = '/stored_query/' + (isCsv ? 'exportcsv' : 'exportkml') + '/';
            var fileDesc = isCsv ? 'CSV' : 'KML';
            if (fileDesc == 'KML' && !this.hasGeoCoords()) {
                $(`<div>
                    ${queryText('unableToExportAsKmlDialogHeader')}
                    <p>${queryText('unableToExportAsKmlDialogMessage')}</p>
                </div>`).dialog({
                    title: queryText('unableToExportAsKmlDialogTitle'),
                    modal: true,
                    close: function() { $(this).remove(); }
                  });
                return;
            }
            const captions = isCsv
                ? undefined
                : _.chain(this.fieldUIs)
                        .filter(function(f) { return f.spqueryfield.get('isdisplay'); })
                        .sortBy(function(f) { return f.spqueryfield.get('position'); })
                        .map(function(f) { return {spec: f.fieldSpec, isdisplay: f.spqueryfield.get('isdisplay')};})
                        .map(function(f){
                            var field = _.last(f.spec.joinPath);
                            var name = f.spec.treeRank || field.getLocalizedName();
                            if (f.spec.datePart &&  f.spec.datePart !== 'fullDate') {
                                name += ' (' + f.spec.datePart + ')';
                            }
                            //return {caption: name, isdisplay: f.isdisplay};
                            return name;
                        }).value();

            this.deleteIncompleteFields(() => {
                if (this.fieldUIs.length < 1) return;
                //sneaky cheat. Doesn't seem to be a facility for localizations in the query api
                //And it may be better to use the 'live' captions in case they get adjusted to avoid duplication.
                const data = this.query.toJSON();
                data.captions = captions ?? data.captions;
                $.post(postUrl, JSON.stringify(data));
                const dialog = $(`<div>
                    ${queryText('queryExportStartedDialogHeader')}
                    <p>${queryText('queryExportStartedDialogMessage')(fileDesc)}</p>
                </div>`).dialog({
                    title: queryText('queryExportStartedDialogTitle'),
                    modal: false,
                    close: function() { $(this).remove(); },
                    buttons: [{
                        text: commonText('close'),
                        click: ()=>dialog.dialog('close')
                    }]
                });
            });

        },

        search_: function() {
            if (this.fieldUIs.length < 1) return;

            this.results && this.results.remove();

            this.results = new QueryResultsTable({
                model: this.model,
                scrollElement: this.$el.parent('main'),
                countOnly: this.query.get('countonly'),
                format: this.query.get('formatauditrecids'),
                fetchResults: this.fetchResults(),
                fetchCount: this.fetchCount(),
                fieldSpecs: _.chain(this.fieldUIs)
                    .filter(function(f) { return f.spqueryfield.get('isdisplay'); })
                    .sortBy(function(f) { return f.spqueryfield.get('position'); })
                    .pluck('fieldSpec')
                    .value()
            });
            this.results.render().$el.appendTo(this.el);
        },
        queryToJson(){
            const query = this.query.toJSON();
            if(this.recordSet)
                query.recordsetid = this.recordSet.id;
            return query;
        },
        fetchResults: function() {
            return (offset)=>{
                const query = this.queryToJson();
                query.offset = offset;
                return $.post('/stored_query/ephemeral/', JSON.stringify(query));
            };
        },
        fetchCount: function() {
            var query = this.queryToJson();
            query.countonly = true;
            return $.post('/stored_query/ephemeral/', JSON.stringify(query));
        },
        moveField: function(queryField, dir) {
            ({
                up:   function() { queryField.$el.prev().insertAfter(queryField.el); },
                down: function() { queryField.$el.next().insertBefore(queryField.el); }
            })[dir]();
            this.updatePositions();
        },
        optionChanged: function() {
            this.query.set({
                selectdistinct: this.$('input[name="selectDistinct"]').prop('checked'),
                countonly: this.$('input[name="countOnly"]').prop('checked'),
                formatauditrecids: this.$('input[name="formatAudits"]').prop('checked')
            });
        }
    });
    
async function fetchRecordSet() {
    const recordSetId = Object.fromEntries(
        new URLSearchParams(window.location.search
    ).entries()).recordsetid ?? undefined;
    if (typeof recordSetId === 'undefined')
        return Promise.resolve(undefined);
    const recordSet = new schema.models.RecordSet.LazyCollection({
        filters: { id: recordSetId },
    });
    await recordSet.fetch();
    return recordSet.models[0];
}

module.exports =  function() {
        router.route('query/:id/', 'storedQuery', function(id) {
            (async function showView() {
                var query = new schema.models.SpQuery.Resource({ id: id });
                await query.fetch().fail(app.handleError);
                var view = new QueryBuilder({
                    query: query,
                    readOnly: userInfo.isReadOnly,
                    recordSet: await fetchRecordSet()
                });
                view.on('redisplay', showView);
                app.setCurrentView(view);
            })();
        });

        router.route('query/new/:table/', 'ephemeralQuery', async function(table) {
            var query = new schema.models.SpQuery.Resource();
            var model = schema.getModel(table);
            query.set({
                'name': "New Query",
                'contextname': model.name,
                'contexttableid': model.tableId,
                'selectdistinct': false,
                'countonly': false,
                'formatauditrecids': false,
                'specifyuser': userInfo.resource_uri,
                'isfavorite': true,
                // ordinal seems to always get set to 32767 by Specify 6
                // needs to be set for the query to be visible in Specify 6
                'ordinal': 32767
            });

            const recordSet = await fetchRecordSet();

            var view = new QueryBuilder({
                query: query,
                readOnly: userInfo.isReadOnly,
                recordSet,
            });
            view.on('redisplay', function() {
                navigation.go(
                    `/query/${query.id}/${
                        typeof recordSet === 'undefined' ?
                            '' :
                            `?recordsetid=${recordSet.id}`
                    }`
                );
            });
            app.setCurrentView(view);
        });

        router.route('query/fromtree/:table/:id/', 'queryFromTree', function(table, nodeId) {
            queryFromTree(userInfo, table, nodeId).done(function(query) {
                var view = new QueryBuilder({ query: query, readOnly: true });
                view.on('redisplay', function() { navigation.go('/query/' + query.id + '/'); });
                app.setCurrentView(view);
            });
        });
    };

