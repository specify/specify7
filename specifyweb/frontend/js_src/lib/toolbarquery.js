"use strict";

const $        = require('jquery');
const _        = require('underscore');
const Q        = require('q');
const Backbone = require('./backbone.js');

const schema         = require('./schema.js');
const navigation     = require('./navigation.js');
const specifyform    = require('./specifyform.js');
const populateform   = require('./populateform.js');
const SaveButton     = require('./savebutton.js');
const DeleteButton   = require('./deletebutton.js');
const initialContext = require('./initialcontext.js');
const userInfo       = require('./userinfo.js');
const commonText = require('./localization/common').default;

    var qbDef;
    initialContext.loadResource('querybuilder.xml', data => qbDef = data);

    var title = commonText('queries');

    var dialog;
    var commonDialogOpts = {
        modal: true,
        close: function() { dialog = null; $(this).remove(); }
    };

    function openQueryListDialog(queries) {
        dialog = new QueryListDialog({ queries: queries, readOnly: userInfo.isReadOnly });
        $('body').append(dialog.el);
        dialog.render();
    }

    function openQueryTypeDialog() {
        dialog && dialog.$el.dialog('close');
        var tables = _.map($('database > table', qbDef), $);
        dialog = new QueryTypeDialog({ tables: tables });
        $('body').append(dialog.el);
        dialog.render();
    }

    var QueryListDialog = Backbone.View.extend({
        __name__: "QueryListDialog",
        className: "stored-queries-dialog table-list-dialog",
        events: {
            'click a.edit': 'edit'
        },
        render: function() {
            var table = $('<table>');
            var makeEntry = this.dialogEntry.bind(this);
            this.options.queries.each(function(query) {
                table.append(makeEntry(query));
            });
            this.options.queries.isComplete() ||
                table.append(`<tr><td></td><td>${commonText('listTruncated')}</td></tr>`);

            this.$el.append(table);
            this.$el.dialog(_.extend({}, commonDialogOpts, {
                title: commonText('queriesDialogTitle')(this.options.queries._totalCount),
                maxHeight: 400,
                buttons: [
                    {text: commonText('new'), click: function(evt) { $(evt.target).prop('disabled', true); openQueryTypeDialog(); }},
                    {text: commonText('cancel'), click: function() { $(this).dialog('close'); }}
                ]
            }));
            return this;
        },
        dialogEntry: function(query) {
            var img = $('<img>', { src: schema.getModelById(query.get('contexttableid')).getIcon() });
            var link = $('<a>', { href: '/specify/query/' + query.id + '/' })
                    .addClass("intercept-navigation")
                    .text(query.get('name'));

            var entry = $('<tr>').append(
                $('<td>').append(img),
                $('<td>').append(link));

            this.options.readOnly || entry.append('<td><a class="edit ui-icon ui-icon-pencil"></a></td>');

            query.get('remarks') && entry.find('a').attr('title', query.get('remarks'));
            return entry;
        },
        edit: function(evt) {
            evt.preventDefault();
            this.$el.dialog('close');
            var index = this.$('a.edit').index(evt.currentTarget);
            dialog = new EditQueryDialog({ spquery: this.options.queries.at(index) });
            $('body').append(dialog.el);
            dialog.render();
        }
    });

    var QueryTypeDialog = Backbone.View.extend({
        __name__: "QueryTypeDialog",
        className: "query-type-dialog table-list-dialog",
        events: {'click a': 'selected'},
        render: function() {
            var $table = $('<table>');
            var makeEntry = this.dialogEntry.bind(this);
            var appendIt = this.shouldShow.bind(this);
            _.each(this.options.tables, function(table, idx) {
                if (appendIt(table)) {
                    $table.append(makeEntry(table, idx));
                }
            });
            this.$el.append($table);
            this.$el.dialog(_.extend({}, commonDialogOpts, {
                title: commonText('newQueryDialogTitle'),
                maxHeight: 400,
                buttons: [{ text: commonText('cancel'), click: function() { $(this).dialog('close'); } }]
            }));
            return this;
        },
        shouldShow: function(table) {
            // could expand this to check table permissions in general when security is implemented.
            //spauditlog is kind of a special case (in sp6 anyway) because its permissions are not user accessible.
            return table.attr('name').toLowerCase() != 'spauditlog' || userInfo.usertype == 'Manager';
        },
        dialogEntry: function(table, idx) {
            var model = schema.getModel(table.attr('name'));
            var img = $('<img>', { src: model.getIcon() });
            var link = $('<a>').text(model.getLocalizedName()).data('idx', idx);
            var entry = $('<tr>').append(
                $('<td>').append(img),
                $('<td>').append(link));
            return entry;
        },
        selected: function(evt) {
            var index = $(evt.currentTarget).data('idx');
            this.$el.dialog('close');
            var table = this.options.tables[index];
            navigation.go('/query/new/' + table.attr('name').toLowerCase() + '/');
        }
    });


    var EditQueryDialog = Backbone.View.extend({
        __name__: "EditQueryDialog",
        className: "query-edit-dialog",
        events: {
            'click .query-export': 'exportQuery',
            'click .create-report, .create-label': 'createReport'
        },
        initialize: function(options) {
            this.spquery = options.spquery;
            this.model = schema.getModelById(this.spquery.get('contexttableid'));
        },
        render: function() {
            specifyform.buildViewByName('Query').done(this._render.bind(this));
            return this;
        },
        _render: function(form) {
            form.find('.specify-form-header:first').remove();

            if (!this.spquery.isNew()) {
                form.append(`
                  <ul style="padding: 0">
                     <li style="display:flex;margin:5px">
                         <span class="ui-icon ui-icon-circle-plus"/>
                         <a class="query-export">${commonText('exportQueryForDwca')}</a>
                     </li>
                     <li style="display:flex;margin:5px">
                         <span class="ui-icon ui-icon-circle-plus"/>
                         <a class="create-report">${commonText('exportQueryAsReport')}</a>
                     </li>
                     <li style="display:flex;margin:5px">
                         <span class="ui-icon ui-icon-circle-plus"/>
                         <a class="create-label">${commonText('exportQueryAsLabel')}</a>
                     </li>
                  </ul>
                `);
            }

            var buttons = $('<div class="specify-form-buttons">').appendTo(form);

            if (!this.readOnly) {
                var saveButton = new SaveButton({ model: this.spquery });
                saveButton.render().$el.appendTo(buttons);
                saveButton.on('savecomplete', function() {
                    navigation.go('/query/' + this.spquery.id + '/');
                    dialog.$el.dialog('close');
                    dialog = null;
                }, this);
            }

            const label = this.spquery.specifyModel.getLocalizedName();
            const title = this.spquery.isNew() ? commonText('newResourceTitle')(label) : label;

            if (!this.spquery.isNew() && !this.readOnly) {
                var deleteButton = new DeleteButton({ model: this.spquery });
                deleteButton.render().$el.appendTo(buttons);
                deleteButton.on('deleted', function() {
                    dialog.$el.dialog('close');
                    dialog = null;
                });
            }

            populateform(form, this.spquery);

            this.$el.append(form).dialog(_.extend({}, commonDialogOpts, {
                width: 'auto',
                title: title
            }));
        },
        createReport(evt) {
            const isLabel = evt.currentTarget.classList.contains('create-label');
            const nameInput = $(`<input
                type="text"
                placeholder="${isLabel ? commonText('labelName') : commonText('reportName')}"
                size="40"
            >`);

            const createReport = () => Q($.post('/report_runner/create/', {
                queryid: this.spquery.id,
                mimetype: isLabel ? "jrxml/label" : "jrxml/report",
                name: nameInput.val(),
            })).then(reportJSON => {
                const report = new schema.models.SpReport.Resource(reportJSON);
                return report.rget('appresource');
            }).done(appresource => navigation.go(`/specify/appresources/${appresource.id}/`));

            $(`<div>
                ${isLabel ? commonText('createLabelDialogHeader') : commonText('createReportDialogHeader')}
            </div>`).append(nameInput).dialog({
                modal: true,
                width: 'auto',
                title: isLabel ? commonText('createLabelDialogTitle') : commonText('createReportDialogTitle'),
                close() { $(this).remove(); },
                buttons: {
                    [commonText('create')]() {
                        if (nameInput.val().trim() == "") return;
                        $(this).dialog('close');
                        createReport();
                    },
                    [commonText('cancel')]() {
                        $(this).dialog('close');
                    }
                }
            });
        },
        exportQuery: function() {
            $.get({url: `/export/extract_query/${this.spquery.id}/`, dataType: 'text'}).done(xml => {
                const dialog = $(`<div>
                    ${commonText('exportQueryForDwcaDialogHeader')}
                    <textarea cols="120" rows="40" readonly></textarea>
                </div>`);
                $('textarea', dialog).text(xml);
                dialog.dialog({
                    modal: true,
                    width: 'auto',
                    title: commonText('exportQueryForDwcaDialogTitle'),
                    close() { $(this).remove(); },
                    buttons: { [commonText('close')]() { $(this).dialog('close'); } }
                });
            });
        }
    });

module.exports =  {
        task: 'query',
        title: title,
        icon: '/static/img/query.png',
        execute: function() {
            if (dialog) return;
            var queries = new schema.models.SpQuery.LazyCollection({
                filters: { specifyuser: userInfo.id, orderby: '-timestampcreated' }
            });
            queries.fetch({ limit: 5000 }).done(function() {
                if (queries._totalCount > 0) {
                    openQueryListDialog(queries);
                } else {
                    openQueryTypeDialog();
                }
            });
        }
    };

