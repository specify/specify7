"use strict";

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');


var schema = require('./schema.js');
var router = require('./router.js');
var app    = require('./specifyapp.js');

const formsText = require('./localization/forms').default;

const SchemaView = Backbone.View.extend({
    __name__: "SchemaView",
    render: function() {
        this.$el.append(`<h2>${formsText('specifySchema')}</h2>`);
        const rows = _.map(
            schema.models, model => $('<tr>').append($('<td>').append(
                $(`<a class="intercept-navigation" href="${model.name.toLowerCase()}/">`).text(model.name)
            ))[0]);
        $('<table>').append(rows).appendTo(this.el);
        return this;
    }
});

function relatedLink(field) {
    const related = field.getRelatedModel();
    if (related == null) return '<td/>';
    const href = `../${related.name.toLowerCase()}/`;
    return $('<td>').append(
        $(`<a class="intercept-navigation" href="${href}">`).text(related.name)
    )[0];
}

const DataModelView = Backbone.View.extend({
    __name__: "DataModelView",
    render: function() {
        const model = schema.getModel(this.options.model);
        this.$el.append($('<h2>').text(model.name));

        const rows = model.getAllFields().map(
            field => $('<tr>')
                .append('<td>' + field.name + '</td>')
                .append('<td>' + field.type + '</td>')
                .append(field.isRelationship ? relatedLink(field) : '<td>')
                .append($('<td>').text(field.dbColumn)[0]) [0]
        );

        $('<table>').append(rows).appendTo(this.el);
        return this;
    }
});


module.exports = function() {
    function view(model) {
        const View = model ? DataModelView : SchemaView;
        app.setCurrentView(new View({ model: model }));
    }

    router.route('datamodel/:model/', 'datamodel', view);
    router.route('datamodel/', 'datamodel', view);
};

