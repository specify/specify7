"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var specifyform       = require('./specifyform.js');
var api               = require('./specifyapi.js');
var dataobjformatters = require('./dataobjformatters.js');
var whenAll           = require('./whenall.js');
var initialContext    = require('./initialcontext.js');
var resourceapi       = require('./resourceapi.js');
const commonText = require('./localization/common').default;

    var dialogdefs;
    initialContext.load('app.resource?name=DialogDefs', data => dialogdefs = data);

    function format(obj) { return dataobjformatters.format(obj); }

module.exports = Backbone.View.extend({
        __name__: "QueryCbxSearch",
        className: "querycbx-dialog-search",
        events: {
            'click .querycbx-search-results a': 'select',
            'keyup input:text': 'keyUp'
        },
        initialize: function(options) {
            this.populateForm = options.populateForm;
            this.forceCollection = options.forceCollection || null;
            this.xtraFilters = options.xtraFilters;
        },
        render: function() {
            var dialogDef = $('dialog[type="search"][name="' + this.model.specifyModel.searchDialog + '"]', dialogdefs);
            specifyform.buildViewByName(dialogDef.attr('view'), 'form', 'search').done(_.bind(this.makeDialog, this));
            return this;
        },
        makeDialog: function(form) {
            $('.specify-field', form).addClass('for-search-form');
            this.populateForm(form, this.model);
            form.find('.specify-form-header, input[value="Delete"], :submit').remove();
            form.find('.specify-field[required]').prop('required',false);
            this.$el.append(form).append('<ul class="querycbx-search-results">');
            this.$el.dialog({
                title: commonText('search'),
                width: 'auto',
                buttons: [
                    {
                        text: commonText('cancel'),
                        click: function() { $(this).dialog("close"); }
                    },
                    {
                        text: commonText('search'),
                        click: _.bind(this.search, this)
                    },
                ],
                open() {
                    $('input:text', this).first().focus();
                },
                close: function() { $(this).remove(); }
            });
        },
    keyUp(evt) {
        if (evt.keyCode === 13) {
            this.search();
        }
    },
        search: function() {
            this.$('.querycbx-search-results').empty();
            api.queryCbxExtendedSearch(this.model, this.forceCollection).done(this.gotResults.bind(this));
        },
    xfilter: function(results) {
        //apply special conditions.
        //probably would be better to send special conditions to server?
        //extremely skimpy. will work only for current known cases
        var self = this;
        results.models = _.filter(results.models, function(result) {
            return _.reduce(self.xtraFilters, function(memo, value){
                if (!memo) {
                    return false;
                }
                return self.applyXFilter(result, value);
            }, true);
        });
        return results;
    },
    applyXFilter: function(item, filter) {
        if (filter.op === 'unbetween') {
            var val = item.get(filter.field);
            var range = filter.value.split(',');
            return val < range[0] && val > range[1];
        } else if (filter.op === 'in') {
            var vals = filter.value.split(',');
            for (var v = 0; v < vals.length; v++) {
                if (vals[v] == item.get(filter.field)) {
                    return true;
                }
            }
            return false;
        } else if (filter.op === 'lt') {
            return item.get(filter.field) < filter.value;
        } else {
            console.warn('extended query combo box filter ignored:', filter);
            return true;
        }
    },
        gotResults: function(results) {
            this.results = this.xfilter(results);
            whenAll(this.results.map(format)).done(this.displayResults.bind(this));
        },
    displayResults: function(formattedResults) {
        const items = _.sortBy( formattedResults.map((formatted, i) => ({
            dom: $('<li>').append($('<a>').text(formatted).data('result-index', i)[0]),
            formatted: formatted
        })), 'formatted');

        this.$('.querycbx-search-results').append(_.pluck(items, 'dom'));

        if (formattedResults.length < 1) this.$('.querycbx-search-results').append(`<li>${commonText('noResults')}</li>`);
        if (formattedResults.length === 100) this.$('.querycbx-search-results').append('<li>...</li>');
    },
        select: function(evt) {
            evt.preventDefault();
            const index = $(evt.currentTarget).data('result-index');
            this.options.selected(this.results.at(index));
            this.$el.dialog('close');
        }
    });

