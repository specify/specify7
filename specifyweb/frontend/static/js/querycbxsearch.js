define([
    'require', 'jquery', 'underscore', 'backbone', 'specifyform', 'specifyapi', 'dataobjformatters', 'whenall',
    'text!context/app.resource?name=DialogDefs!noinline'
], function (require, $, _, Backbone, specifyform, api, dataobjformatters, whenAll, dialogdefxml) {
    "use strict";

    function format(obj) { return dataobjformatters.format(obj); }

    var dialogdefs = $.parseXML(dialogdefxml);

    return Backbone.View.extend({
        __name__: "QueryCbxSearch",
        className: "querycbx-dialog-search",
        events: {
            'click .querycbx-search-results a': 'select'
        },
        initialize: function(options) {
            this.forceCollection = options.forceCollection || null;
            this.dialogDef = $('dialog[type="search"][name="' + this.model.specifyModel.searchDialog + '"]', dialogdefs);
        },
        render: function() {
            $.when(
                specifyform.buildViewByName(this.dialogDef.attr('view'), 'form', 'search'),
                specifyform.buildViewByName(this.dialogDef.attr('view'), 'formtable', 'search')
            ).done(this.makeDialog.bind(this));

            return this;
        },
        makeDialog: function(searchForm, resultsForm) {
            this.resultsForm = resultsForm;

            require("populateform")(searchForm, this.model);
            searchForm.find('.specify-form-header, input[value="Delete"], :submit').remove();
            searchForm.find('.specify-required-field').removeClass('specify-required-field');
            this.$el.append(searchForm).append('<div class="querycbx-search-results">');
            this.$el.dialog({
                title: 'Search',
                width: 'auto',
                buttons: [
                    {
                        text: "Search",
                        click: _.bind(this.search, this)
                    },
                    {
                        text: "Cancel",
                        click: function() { $(this).dialog("close"); }
                    }
                ],
                close: function() { $(this).remove(); }
            });
        },
        search: function() {
            this.$('.querycbx-search-results').empty();
            api.queryCbxExtendedSearch(this.model, this.forceCollection).done(this.gotResults.bind(this));
        },
        gotResults: function(results) {
            this.results = results;
            var rows = results.map(function(resource) {
                var form = this.resultsForm.clone();
                $('a.specify-edit', form).remove();
                return require("populateform")(form, resource);
            }, this);
            this.$('.querycbx-search-results').append(rows[0]).find('.specify-form-header').remove();
            _(rows).chain().tail().each(function(row) {
                this.$('.querycbx-search-results .specify-view-content-container').append($('.specify-view-content:first', row));
            }, this);
        },
        displayResults: function(formattedResults) {
            var items = _.map(formattedResults, function(formattedResult) {
                return $('<li>').append($('<a>').text(formattedResult))[0];
            });
            this.$('.querycbx-search-results').append(items);

            if (formattedResults.length < 1) this.$('.querycbx-search-results').append('<li>No hits</li>');
            if (formattedResults.length > 9) this.$('.querycbx-search-results').append('<li>...</li>');
        },
        select: function(evt) {
            evt.preventDefault();
            var index = this.$('.querycbx-search-results a').index(evt.currentTarget);
            this.options.selected(this.results.at(index));
            this.$el.dialog('close');
        }
    });
});
