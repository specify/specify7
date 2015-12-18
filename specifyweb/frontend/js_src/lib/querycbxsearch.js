"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var specifyform       = require('./specifyform.js');
var api               = require('./specifyapi.js');
var dataobjformatters = require('./dataobjformatters.js');
var whenAll           = require('./whenall.js');
var initialContext    = require('./initialcontext.js');

    var dialogdefs;
    initialContext.load('app.resource?name=DialogDefs', data => dialogdefs = data);

    function format(obj) { return dataobjformatters.format(obj); }

module.exports = Backbone.View.extend({
        __name__: "QueryCbxSearch",
        className: "querycbx-dialog-search",
        events: {
            'click .querycbx-search-results a': 'select'
        },
        initialize: function(options) {
            this.populateForm = options.populateForm;
            this.forceCollection = options.forceCollection || null;
        },
        render: function() {
            var dialogDef = $('dialog[type="search"][name="' + this.model.specifyModel.searchDialog + '"]', dialogdefs);
            specifyform.buildViewByName(dialogDef.attr('view'), 'form', 'search').done(_.bind(this.makeDialog, this));
            return this;
        },
        makeDialog: function(form) {
            this.populateForm(form, this.model);
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
            this.$('.querycbx-search-results').empty();
            api.queryCbxExtendedSearch(this.model, this.forceCollection).done(this.gotResults.bind(this));
        },
        gotResults: function(results) {
            this.results = results;
            whenAll(results.map(format)).done(this.displayResults.bind(this));
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

