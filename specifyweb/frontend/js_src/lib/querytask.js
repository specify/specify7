"use strict";

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');

var schema             = require('./schema.js');
var QueryFieldUI       = require('./queryfield.js');
var template           = require('./templates/querybuilder.html');
var userInfo           = require('./userinfo.js');
var app                = require('./specifyapp.js');
var queryFromTree      = require('./queryfromtree.js');
var navigation         = require('./navigation.js');
var QueryResultsTable  = require('./queryresultstable.js');
var EditResourceDialog = require('./editresourcedialog.js');
var router             = require('./router.js');

    var setTitle = app.setTitle;

    var QueryBuilder = Backbone.View.extend({
        __name__: "QueryBuilder",
        events: {
            'change :checkbox': 'optionChanged',
            'click .query-execute': 'search',
            'click .query-to-recordset': 'makeRecordSet',
            'click .query-save': 'save',
            'click .field-add': 'addField',
            'click .abandon-changes': function() { this.trigger('redisplay'); }
        },
        initialize: function(options) {
            this.query = options.query;
            this.readOnly = options.readOnly;
            this.model = schema.getModel(this.query.get('contextname'));
        },
        render: function() {
            var title = 'Query: ' + this.query.get('name');
            setTitle(title);
            this.$el.append(template({ cid: this.cid }));
            this.$('.querybuilder-header span').text(title);
            this.$('.querybuilder-header img').attr('src', this.model.getIcon());
            this.query.isNew() && this.$('.abandon-changes').remove();
            this.readOnly && this.$('.query-save, .query-to-recordset').remove();

            this.$('button.field-add').button({
                icons: { primary: 'ui-icon-plus' }, text: false
            });

            this.query.on('saverequired', this.saveRequired, this);

            this.query.rget('fields').done(this.gotFields.bind(this));

            this.$('input[name="selectDistinct"]').prop('checked', this.query.get('selectdistinct'));
            this.$('input[name="countOnly"]').prop('checked', this.query.get('countonly'));
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
            this.$('.query-execute, .query-to-recordset').prop('disabled', false);
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
            (this.fieldUIs.length < 1) && this.$('.query-execute, .query-save, .query-to-recordset').prop('disabled', true);
        },
        updatePositions: function() {
            _.invoke(this.fieldUIs, 'positionChanged');
        },
        contractFields: function() {
            _.each(this.fieldUIs, function(field) { field.expandToggle('hide'); });
        },
        deleteIncompleteFields: function() {
            _.invoke(this.fieldUIs, 'deleteIfIncomplete');
        },
        saveRequired: function() {
            this.$('.abandon-changes, .query-save').prop('disabled', false);
        },
        save: function() {
            if (this.readOnly) return;
            this.deleteIncompleteFields();
            if (this.fieldUIs.length < 1) return;
            this.query.save().done(this.trigger.bind(this, 'redisplay'));
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
            this.deleteIncompleteFields();
            if (this.fieldUIs.length < 1) return;

            var dialog = $('<div title="Record Set from Query">' +
                           '<p>Generating record set.</p><div class="progress" />' +
                           '</div>').dialog({
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
                    dialog.html('<p>Go to newly created record set now?</p>')
                        .dialog('option', 'buttons', [
                            {text: "Yes", click: function() {
                                navigation.go('/specify/recordset/' + recordset.id + '/');
                            }},
                            {text: "No", click: function() { $(this).dialog('close'); }}
                        ]);
                });
        },
        search: function(evt) {
            this.$('.query-execute').blur();
            this.deleteIncompleteFields();
            if (this.fieldUIs.length < 1) return;

            this.results && this.results.remove();

            this.results = new QueryResultsTable({
                model: this.model,
                scrollOnWindow: true,
                countOnly: this.query.get('countonly'),
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
        fetchResults: function() {
            var query = this.query.toJSON();
            return function(offset) {
                query.offset = offset;
                return $.post('/stored_query/ephemeral/', JSON.stringify(query));
            };
        },
        fetchCount: function() {
            var query = this.query.toJSON();
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
                countonly: this.$('input[name="countOnly"]').prop('checked')
            });
        }
    });

module.exports =  function() {
        router.route('query/:id/', 'storedQuery', function(id) {
            (function showView() {
                var query = new schema.models.SpQuery.Resource({ id: id });
                query.fetch().fail(app.handleError).done(function() {
                    var view = new QueryBuilder({ query: query, readOnly: userInfo.isReadOnly });
                    view.on('redisplay', showView);
                    app.setCurrentView(view);
                });
            })();
        });

        router.route('query/new/:table/', 'ephemeralQuery', function(table) {
            var query = new schema.models.SpQuery.Resource();
            var model = schema.getModel(table);
            query.set({
                'name': "New Query",
                'contextname': model.name,
                'contexttableid': model.tableId,
                'selectdistinct': false,
                'countonly': false,
                'specifyuser': userInfo.resource_uri,
                'isfavorite': true,
                // ordinal seems to always get set to 32767 by Specify 6
                // needs to be set for the query to be visible in Specify 6
                'ordinal': 32767
            });

            var view = new QueryBuilder({ query: query, readOnly: userInfo.isReadOnly });
            view.on('redisplay', function() { navigation.go('/query/' + query.id + '/'); });
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

