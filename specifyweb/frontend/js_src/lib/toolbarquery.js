"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var schema         = require('./schema.js');
var navigation     = require('./navigation.js');
var specifyform    = require('./specifyform.js');
var populateform   = require('./populateform.js');
var SaveButton     = require('./savebutton.js');
var DeleteButton   = require('./deletebutton.js');
var initialContext = require('./initialcontext.js');
var userInfo       = require('./userinfo.js');

    var qbDef;
    initialContext.loadResource('querybuilder.xml', data => qbDef = data);

    var title = "Query";

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
                table.append('<tr><td></td><td>(list truncated)</td></tr>');

            this.$el.append(table);
            this.$el.dialog(_.extend({}, commonDialogOpts, {
                title: "Queries (" + this.options.queries._totalCount + ")",
                maxHeight: 400,
                buttons: [
                    {text: 'New', click: function(evt) { $(evt.target).prop('disabled', true); openQueryTypeDialog(); }},
                    {text: 'Cancel', click: function() { $(this).dialog('close'); }}
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
            _.each(this.options.tables, function(table) {
                $table.append(makeEntry(table));
            });
            this.$el.append($table);
            this.$el.dialog(_.extend({}, commonDialogOpts, {
                title: "New Query Type",
                maxHeight: 400,
                buttons: [{ text: 'Cancel', click: function() { $(this).dialog('close'); } }]
            }));
            return this;
        },
        dialogEntry: function(table) {
            var model = schema.getModel(table.attr('name'));
            var img = $('<img>', { src: model.getIcon() });
            var link = $('<a>').text(model.getLocalizedName());
            var entry = $('<tr>').append(
                $('<td>').append(img),
                $('<td>').append(link));
            return entry;
        },
        selected: function(evt) {
            var index = this.$('a').index(evt.currentTarget);
            this.$el.dialog('close');
            var table = this.options.tables[index];
            navigation.go('/query/new/' + table.attr('name').toLowerCase() + '/');
        }
    });


    var EditQueryDialog = Backbone.View.extend({
        __name__: "EditQueryDialog",
        className: "query-edit-dialog",
        events: {'click .query-export': 'exportQuery'},
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

            var title = (this.spquery.isNew() ? "New " : "") + this.spquery.specifyModel.getLocalizedName();

            if (!this.spquery.isNew() && !this.readOnly) {
                var deleteButton = new DeleteButton({ model: this.spquery });
                deleteButton.render().$el.appendTo(buttons);
                deleteButton.on('deleted', function() {
                    dialog.$el.dialog('close');
                    dialog = null;
                });

                $('<input type="button" value="Export" class="query-export">').appendTo(buttons);
            }

            populateform(form, this.spquery);

            this.$el.append(form).dialog(_.extend({}, commonDialogOpts, {
                width: 'auto',
                title: title
            }));
        },
        exportQuery: function() {
            this.spquery.rget('fields').done(function(fields) {
                var doc = document.implementation.createDocument("", "", null);
                var query = doc.createElement("query");
                query.setAttribute("name", this.spquery.get("name"));
                query.setAttribute("contextName", this.spquery.get("contextname"));
                query.setAttribute("contextTableId", this.spquery.get("contexttableid"));
                query.setAttribute("isFavorite", this.spquery.get("isfavorite"));
                query.setAttribute("named", "true");
                query.setAttribute("ordinal", this.spquery.get("ordinal"));
                query.setAttribute("appversion", "6.5.02"); // TODO: get appropriate value from somewhere

                fields.each(this.exportField.bind(this, doc, query));

                var queries = doc.createElement("queries");
                queries.appendChild(query);
                doc.appendChild(queries);

                var blob = new Blob([
                    new XMLSerializer().serializeToString(doc)
                ], {type: 'application/xml'});

                window.open(window.URL.createObjectURL(blob));
            }.bind(this));
        },
        exportField: function(doc, query, field) {
            var f = doc.createElement("field");
            _.each(["position", "fieldName", "isNot", "isDisplay", "isPrompt", "isRelFld",
                    "alwaysFilter", "stringId", "operStart", "operEnd", "startValue", "endValue",
                    "sortType", "tableList", "contextTableIdent", "columnAlias"], function(attr) {
                        f.setAttribute(attr, field.get(attr.toLowerCase()));
                    });
            query.appendChild(f);
        }
    });

module.exports =  {
        task: 'query',
        title: title,
        icon: '/images/Query32x32.png',
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

