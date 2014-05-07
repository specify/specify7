define([
    'jquery', 'underscore', 'backbone', 'navigation', 'specifyform', 'populateform',
    'fieldformat', 'dataobjformatters', 'jquery-ui'
], function($, _, Backbone, navigation, specifyform, populateform, fieldformat, dataobjformatters) {
    "use strict";

    var objformat = dataobjformatters.format, aggregate = dataobjformatters.aggregate;

    function getField(fieldSpec) {
        return _.last(fieldSpec.joinPath);
    }

    function renderResult(fieldSpec, rowHref, value) {
        var field = getField(fieldSpec);
        var cell = $('<a class="query-result-link">')
                .prop('href', rowHref);

        if (field.isRelationship) {
            (field.type === 'many-to-one') ?
                setupToOneCell(fieldSpec, cell, value) :
                setupToManyCell(fieldSpec, cell, value);
        } else {
            cell.text(formatValue(fieldSpec, value));
        }
        return $('<td>').append(cell);
    }

    function formatValue(fieldSpec, value) {
        var field = getField(fieldSpec);
        if (!field) return value;
        if (!fieldSpec.datePart || fieldSpec.datePart == 'Full Date') {
            return fieldformat(field, value);
        }
        return value;
    }

    function setupToOneCell(fieldSpec, cell, cellValue) {
        var field = getField(fieldSpec);
        if (cellValue == null) return;
        cell.text('(loading...)');
        var resource = new (field.getRelatedModel().Resource)({ id: cellValue });
        objformat(resource).done(function(formatted) { cell.text(formatted); });
    }

    function setupToManyCell(fieldSpec, cell, cellValue) {
        var field = getField(fieldSpec);
        if (cellValue == null) return;
        cell.text('(loading...)');
        var parentResource = new field.model.Resource({ id: cellValue });
        parentResource.rget(field.name, true).pipe(aggregate).done(function(formatted) {
            cell.text(formatted);
        });
    }


    var QueryResultsView = Backbone.View.extend({
        __name__: "QueryResultsView",
        events: {
            'click .query-result-link': 'openRecord'
        },
        initialize: function(options) {
            this.fieldSpecs = options.fieldSpecs;
            this.model = options.model;
        },
        detectEndOfResults: function(results) {
            $('.query-results-count').text(results.count);
            return results.results.length < 1;
        },
        addResults: function(results) {
            _.each(results.results, function(result) {
                var resource = new this.model.Resource({ id: result[0] });
                var row = $('<tr class="query-result">').appendTo(this.el).data('resource', resource);
                var href = resource.viewUrl();
                _.each(this.fieldSpecs, function(f, i) { row.append(renderResult(f, href, result[i + 1])); });
            }, this);
            return results.results.length;
        },
        openRecord: function(evt) {
            evt.preventDefault();
            var resource = $(evt.currentTarget).closest('.query-result').data('resource');

            specifyform.buildViewByName(resource.specifyModel.view, null, 'view').done(function(dialogForm) {
                dialogForm.find('.specify-form-header:first').remove();

                populateform(dialogForm, resource);

                var dialog = $('<div>').append(dialogForm).dialog({
                    width: 'auto',
                    title:  resource.specifyModel.getLocalizedName(),
                    close: function() { $(this).remove(); }
                });

                // if (!resource.isNew()) {  // <- always true.
                dialog.closest('.ui-dialog').find('.ui-dialog-titlebar:first').prepend(
                    '<a href="' + resource.viewUrl() + '"><span class="ui-icon ui-icon-link">link</span></a>');

                dialog.parent().delegate('.ui-dialog-title a', 'click', function(evt) {
                    evt.preventDefault();
                    navigation.go(resource.viewUrl());
                    dialog.dialog('close');
                });
            });
        }
    });

    return QueryResultsView;
});
