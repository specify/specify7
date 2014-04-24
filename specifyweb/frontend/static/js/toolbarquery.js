define([
    'require', 'jquery', 'underscore', 'backbone', 'schema', 'navigation',
    'specifyform', 'populateform', 'savebutton', 'deletebutton',
    'text!resources/querybuilder.xml!noinline',
    'jquery-ui'
], function(require, $, _, Backbone, schema, navigation,
            specifyform, populateform, SaveButton, DeleteButton,
            querybuilderXML) {
    "use strict";
    var qbDef = $.parseXML(querybuilderXML);

    var title = "Query";

    var dialog;
    var commonDialogOpts = {
        modal: true,
        close: function() { dialog = null; $(this).remove(); }
    };

    var QueryListDialog = Backbone.View.extend({
        __name__: "QueryListDialog",
        className: "stored-queries-dialog list-dialog",
        events: {
            'click a.edit': 'edit'
        },
        render: function() {
            var ul = $('<ul>');
            var makeEntry = this.dialogEntry.bind(this);
            this.options.queries.each(function(query) {
                ul.append(makeEntry(query));
            });
            this.options.queries.isComplete() || ul.append('<li>(list truncated)</li>');
            this.$el.append(ul);
            this.$el.dialog(_.extend({}, commonDialogOpts, {
                title: "Queries (" + this.options.queries._totalCount + ")",
                maxHeight: 400,
                buttons: this.buttons()
            }));
            return this;
        },
        dialogEntry: function(query) {
            var img = $('<img>', { src: schema.getModelById(query.get('contexttableid')).getIcon() });
            var entry = $('<li>').append(
                $('<a>', { href: '/specify/query/' + query.id + '/' })
                    .addClass("intercept-navigation")
                    .text(query.get('name'))
                    .prepend(img));

            this.options.readOnly || entry.append(
                '<a class="edit"><span class="ui-icon ui-icon-pencil">edit</span></a></li>');
                
            query.get('remarks') && entry.find('a').attr('title', query.get('remarks'));
            return entry;
        },
        buttons: function() {
            var buttons = this.options.readOnly ? [] : [
                {text: 'New', click: function(evt) { $(evt.target).prop('disabled', true); openQueryTypeDialog(); }}
            ];
            buttons.push({text: 'Cancel', click: function() { $(this).dialog('close'); }});
            return buttons;
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

    function openQueryTypeDialog() {
        dialog && dialog.$el.dialog('close');
        var tables = _.map($('database > table', qbDef), $);
        dialog = new QueryTypeDialog({ tables: tables });
        $('body').append(dialog.el);
        dialog.render();
    }

    var QueryTypeDialog = Backbone.View.extend({
        __name__: "QueryTypeDialog",
        className: "query-type-dialog list-dialog",
        events: {'click a': 'selected'},
        render: function() {
            var ul = $('<ul>');
            var makeEntry = this.dialogEntry.bind(this);
            _.each(this.options.tables, function(table) {
                ul.append($('<li>').append(makeEntry(table)));
            });
            ul.find('a').removeClass('intercept-navigation');
            ul.find('a.edit').remove();
            this.$el.append(ul);
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
            return $('<a>').addClass("intercept-navigation").text(model.getLocalizedName()).prepend(img);
        },
        selected: function(evt) {
            var app = require('specifyapp');
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
            var _this = this;

            specifyform.buildViewByName('Query').done(function(form) {
                form.find('.specify-form-header:first').remove();

                if (!_this.readOnly) {
                    var saveButton = new SaveButton({ model: _this.spquery });
                    saveButton.render().$el.appendTo(form);
                    saveButton.on('savecomplete', function() {
                        navigation.go('/query/' + _this.spquery.id + '/');
                    });
                }

                var title = (_this.spquery.isNew() ? "New " : "") + _this.spquery.specifyModel.getLocalizedName();

                if (!_this.spquery.isNew() && !_this.readOnly) {
                    var deleteButton = new DeleteButton({ model: _this.spquery });
                    deleteButton.render().$el.appendTo(form);
                    deleteButton.on('deleted', function() {
                        dialog.$el.dialog('close');
                        dialog = null;
                    });

                    $('<input type="button" value="Export" class="query-export">').appendTo(form);
                }

                populateform(form, _this.spquery);

                _this.$el.append(form).dialog(_.extend({}, commonDialogOpts, {
                        width: 'auto',
                        title: title
                }));
            });
            return this;
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

    return {
        task: 'query',
        title: title,
        icon: '/images/Query32x32.png',
        execute: function() {
            if (dialog) return;
            var app = require('specifyapp');
            var queries = new schema.models.SpQuery.LazyCollection({
                filters: { specifyuser: app.user.id, orderby: '-timestampcreated' }
            });
            queries.fetch({ limit: 5000 }).done(function() {
                dialog = new QueryListDialog({ queries: queries, readOnly: app.isReadOnly });
                $('body').append(dialog.el);
                dialog.render();
            });
        }
    };
});
