"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';


import schema, {getModel} from './schema';
import router from './router';
import * as app from './specifyapp';

import formsText from './localization/forms';

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
        const model = getModel(this.options.model);
        this.$el.append($('<h2>').text(model.name));

        const rows = model.fields.map(
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


export default function() {
    function view(model) {
        const View = model ? DataModelView : SchemaView;
        app.setCurrentView(new View({ model: model }));
    }

    router.route('datamodel/:model/', 'datamodel', view);
    router.route('datamodel/', 'datamodel', view);
};

