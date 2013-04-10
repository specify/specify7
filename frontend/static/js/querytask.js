define([
    'jquery', 'underscore', 'backbone', 'navigation', 'cs!appresource', 'schema',
    'specifyapi', 'cs!fieldformat', 'cs!props', 'whenall', 'scrollresults',
    'jquery-bbq', 'jquery-ui'
], function($, _, Backbone, navigation, getAppResource, schema, api, fieldformat, props, whenAll, ScrollResults) {
    "use strict";
    var STRINGID_RE = /^([^\.]*)\.([^\.]*)\.(.*)$/;

    function stringIdToFieldSpec(stringId) {
        var match = STRINGID_RE.exec(stringId);
        var path = match[1].split(',');
        var tableName = match[2];
        var fieldName = match[3];
        var rootTable = schema.getModelById(parseInt(path.shift(), 10));

        var joinPath = [];
        var node = rootTable;
        _.each(path, function(elem) {
            var tableId_fieldName = elem.split('-');
            var table = schema.getModelById(parseInt(tableId_fieldName[0], 10));
            var fieldName = tableId_fieldName[1];
            var field = _.isUndefined(fieldName) ? node.getField(table.name) : node.getField(fieldName);
            joinPath.push(field);
            node = table;
        });

        var field = node.getField(fieldName);
        return _.extend({joinPath: joinPath, table: node, field: field}, extractDatePart(fieldName));
    }

    var DATE_PART_RE = /(.*)((NumericDay)|(NumericMonth)|(NumericYear))$/;

    function extractDatePart(fieldName) {
        var match = DATE_PART_RE.exec(fieldName);
        return match ? {
            fieldName: match[1],
            datePart: match[2].replace('Numeric', '')
        } : {
            fieldName: fieldName,
            datePart: null
        };
    }

    var FieldUI = Backbone.View.extend({
        opName: 'NA',
        input: '<input type="text">',
        initialize: function(options) {
            this.field = options.field;
            this.fieldSpec = stringIdToFieldSpec(this.field.get('stringid'));
        },
        render: function() {
            var self = this;
            self.queryParamKey = 'f' + self.field.id;
            $('<label>').text(this.getLabel()).appendTo(self.el);
            $('<span>').text(self.opName).appendTo(self.el);
            if (self.input) {
                $(self.input).appendTo(self.el);
                self.setValue(self.field.get('startvalue'));
            }
            return self;
        },
        getFieldName: function() {
            var predField = this.fieldSpec.field || this.fieldSpec.table.getField(this.fieldSpec.fieldName);
            var fieldName = predField ? predField.getLocalizedName() : this.fieldSpec.fieldName;
            if (this.fieldSpec.datePart) {
                fieldName += ' (' + this.fieldSpec.datePart + ') ';
            }
            return fieldName;
        },
        getLabel: function() {
            var fieldName = this.getFieldName();
            var joinPath = _.invoke(this.fieldSpec.joinPath, 'getLocalizedName').concat(fieldName);
            return joinPath.join(' -> ');
        },
        getQueryParam: function() {
            var result = {};
            result[this.queryParamKey] = this.getValue();
            return result;
        },
        getValue: function() {
            return this.$('input').val();
        },
        setValue: function(value) {
            this.$('input').val(value);
        }
    });

    var FieldUIByOp = _.map([
        {opName: 'Like'},
        {opName: '='},
        {opName: '>'},
        {opName: '<'},
        {opName: '>='},
        {opName: '<='},
        {opName: 'True', input: null},
        {opName: 'False', input: null},
        {opName: 'Does not matter', input: null},

        {opName: 'Between',
         input: '<input type="text"> and <input type="text">',
         getValue: function() {
             return _.map(this.$('input'), function(input) { return $(input).val(); }).join(',');
         },
         setValue: function(value) {
             var values = value.split(',');
             _.each(this.$('input'), function(input, i) { $(input).val(values[i]); });
         }
        },

        {opName: 'In'},
        {opName: 'Contains'},
        {opName: 'Empty', input: null},
        {opName: 'True or Null', input: null},
        {opName: 'True or False', input: null}
    ], function(extras) { return FieldUI.extend(extras); });

    var Results = Backbone.View.extend({
        events: {
            'click a.query-result': 'navToResult'
        },
        initialize: function(options) {
            this.fields = options.fields;
            this.model = options.model;
            this.fieldUIs = options.fieldUIs;
            this.initResults = options.results;
        },
        render: function() {
            this.addResults(this.initResults);
            return this;
        },
        detectEndOfResults: function(results) {
            return results.length < 2;
        },
        addResults: function(results) {
            var self = this;
            var columns = results.shift();
            var fieldToCol = function(field) {
                return _(columns).indexOf(field.id);
            };

            _.each(results, function(result) {
                var row = $('<tr>').appendTo(self.el);
                var resource = new (api.Resource.forModel(self.model))({
                    id: result[0]
                });
                var href = resource.viewUrl();
                _.each(self.fieldUIs, function(fieldUI) {
                    var value = result[fieldToCol(fieldUI.field)];
                    var field = fieldUI.fieldSpec.field;
                    if (field) {
                        value = fieldformat(field, value);
                    }
                    row.append($('<td>').append($('<a>', {
                        href: href,
                        "class": "query-result"
                    }).text(value)));
                });
            });
            this.lastID = _.last(results)[0];
        },
        getLastID: function() {
            return this.lastID;
        },
        navToResult: function(evt) {
            evt.preventDefault();
            return navigation.go($(evt.currentTarget).prop('href'));
        }
    });

    var StoredQueryView = Backbone.View.extend({
        events: {
            'click :button': 'search'
        },
        initialize: function(options) {
            var self = this;
            self.query = options.query;
            self.model = schema.getModel(self.query.get('contextname'));
        },
        render: function() {
            var self = this;
            self.$el.append($('<h2>').text(self.query.get('name')));
            var ul = $('<ul>').appendTo(self.el);
            $('<input type="button" value="Search">').appendTo(self.el);

            self.query.rget('fields', true).done(function(fields) {
                self.fields = fields;
                self.fieldUIs = fields.chain()
                    .filter(function(field) { return field.get('isprompt'); })
                    .map(function(field) {
                        var fieldUICtr = FieldUIByOp[field.get('operstart')];
                        return new fieldUICtr({field: field, el: $('<li class="spqueryfield">')});
                    }).value();

                _.each(self.fieldUIs, function(fieldUI) { ul.append(fieldUI.render().el); });
            });

            $('<table class="results" width="100%"></div>').appendTo(self.el);

            return self;
        },
        renderHeader: function() {
            var header = $('<tr>');
            _.each(this.fieldUIs, function(fieldUI) {
                header.append($('<th>').text(fieldUI.getFieldName()));
            });
            return header;
        },
        search: function(evt) {
            var self = this;
            var table = self.$('table.results');

            var queryParams = {};
            _.each(self.fieldUIs, function(fieldUI) {
                _.extend(queryParams, fieldUI.getQueryParam());
            });

            table.empty();
            table.append(self.renderHeader());

            var ajaxUrl = $.param.querystring("/stored_query/query/" + self.query.id + "/",
                                              queryParams);

            $.get(ajaxUrl).done(function(results) {
                var view = new ScrollResults({
                    View: Results,
                    el: table,
                    viewOptions: {
                        fields: self.fields,
                        model: self.model,
                        fieldUIs: self.fieldUIs,
                        results: results
                    },
                    ajaxUrl: ajaxUrl
                });
                view.render();
                view.fetchMoreWhileAppropriate();
            });
        }
    });

    return function(app) {
        app.router.route('query/:id/', 'storedQuery', function(id) {
            var query = new (api.Resource.forModel('spquery'))({ id: id });
            query.fetch().fail(app.handleError).done(function() {
                app.setCurrentView(new StoredQueryView({ query: query }));
            });
        });
    };
});
