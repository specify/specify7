define([
    'jquery', 'underscore', 'backbone', 'navigation', 'specifyform', 'populateform',
    'jquery-ui'
], function($, _, Backbone, navigation, specifyform, populateform) {
    "use strict";

    return Backbone.View.extend({
        __name__: "QueryResultsView",
        events: {
            'click .query-result-link': 'openRecord'
        },
        initialize: function(options) {
            this.fieldUIs = options.fieldUIs;
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
                _.chain(this.fieldUIs)
                    .filter(function(f) { return f.spqueryfield.get('isdisplay'); })
                    .sortBy(function(f) { return f.spqueryfield.get('position'); })
                    .each(function(f, i) { row.append(f.renderResult(href, result[i + 1])); });
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
});
