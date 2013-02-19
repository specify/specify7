define([
'jquery', 'underscore', 'backbone', 'navigation', 'cs!appresource', 'schema',
'specifyapi', 'cs!fieldformat', 'cs!props', 'whenall', 'jquery-bbq', 'jquery-ui'
], function($, _, Backbone, navigation, getAppResource, schema, api, fieldformat, props, whenAll) {
    "use strict";

    var FieldUI = Backbone.View.extend({
        opName: 'NA',
        input: '<input type="text">',
        render: function() {
            var self = this;
            var field = self.options.field;
            self.queryParamKey = 'f' + field.id;
            $('<label>').text(field.get('columnalias')).appendTo(self.el);
            $('<span>').text(self.opName).appendTo(self.el);
            if (self.input) {
                $(self.input).appendTo(self.el);
                self.setValue(field.get('startvalue'));
            }
            return self;
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

    return Backbone.View.extend({
        events: {
            'click a.query-result': 'navToResult',
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
        search: function(evt) {
            var self = this;
            var table = self.$('table.results');
            var ajaxUrl = "/stored_query/query/" + self.query.id + "/";

            var queryParams = {};
            _.each(self.fieldUIs, function(fieldUI) {
                _.extend(queryParams, fieldUI.getQueryParam());
            });

            table.empty();

            $.get(ajaxUrl, queryParams).done(function(results) {
                self.renderHeader(self.fields);
                var columns = results.shift();
                var fieldToCol = function(field) {
                    return _(columns).indexOf(field.id);
                };

                _.each(results, function(result) {
                    var href, resource, row;
                    row = $('<tr>').appendTo(table);
                    resource = new (api.Resource.forModel(self.model))({
                        id: result[0]
                    });
                    href = resource.viewUrl();
                    self.fields.each(function(field) {
                        var value = result[fieldToCol(field)];
                        row.append($('<td>').append($('<a>', {
                            href: href,
                            "class": "query-result"
                        }).text(value)));
                    });
                });
            });
        },
        renderHeader: function(fields) {
            var header;
            header = $('<tr>').appendTo(this.$('.results'));
            return fields.each(function(field) {
                return header.append($('<th>').text(field.get('columnalias')));
            });
        },
        navToResult: function(evt) {
            evt.preventDefault();
            return navigation.go($(evt.currentTarget).prop('href'));
        }
    });
});
