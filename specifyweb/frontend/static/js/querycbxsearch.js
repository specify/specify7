define([
    'require', 'jquery', 'underscore', 'backbone', 'specifyform', 'specifyapi', 'dataobjformatters', 'whenall',
    'text!context/app.resource?name=DialogDefs!noinline'
], function (require, $, _, Backbone, specifyform, api, dataobjformatters, whenAll, dialogdefxml) {
    "use strict";
    var dialogdefs = $.parseXML(dialogdefxml);

    return Backbone.View.extend({
        __name__: "QueryCbxSearch",
        className: "querycbx-dialog-search",
        events: {
            'click .querycbx-search-results a': 'select'
        },
        render: function() {
            var dialogDef = $('dialog[type="search"][name="' + this.model.specifyModel.searchDialog + '"]', dialogdefs);
            specifyform.buildViewByName(dialogDef.attr('view'), 'form', 'search').done(_.bind(this.makeDialog, this));
            return this;
        },
        makeDialog: function(form) {
            require("populateform")(form, this.model);
            form.find('.specify-form-header, input[value="Delete"], :submit').remove();
            form.find('.specify-required-field').removeClass('specify-required-field');
            this.$el.append(form).append('<ul class="querycbx-search-results">');
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
            function format(obj) {
                return dataobjformatters.format(obj);
            }

            this.$('.querycbx-search-results').empty();

            var _this = this;
            api.queryCbxExtendedSearch(this.model).pipe(function(results) {
                _this.results = results;
                return whenAll(_this.results.map(format));
            }).done(function(formattedResults) {
                _.each(formattedResults, function(formattedResult) {
                    $('<li>')
                        .append($('<a href=\"#\">').text(formattedResult))
                        .appendTo(_this.$('.querycbx-search-results'));
                });

                if (formattedResults.length < 1) _this.$('.querycbx-search-results').append('<li>No hits</li>');
                if (formattedResults.length > 9) _this.$('.querycbx-search-results').append('<li>...</li>');
            });
        },
        select: function(evt) {
            evt.preventDefault();
            var index = this.$('.querycbx-search-results a').index(evt.currentTarget);
            this.options.selected(this.results.at(index));
            this.$el.dialog('close');
        }
    });
});
