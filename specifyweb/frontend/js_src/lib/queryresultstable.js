"use strict";

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');


var template      = require('./templates/queryresults.html');
var ScrollResults = require('./scrollresults.js');
var QueryResults  = require('./queryresults.js');
const queryText = require('./localization/query').default;
const commonText = require('./localization/common').default;
const dataModelStorage = require('./wbplanviewmodel').default;
const fetchDataModel = require('./wbplanviewmodelfetcher').default;

let dataModelPromise = fetchDataModel();

    function renderHeader(fieldSpec) {
        const field = _.last(fieldSpec.joinPath);
        const icon = field && field.model.getIcon();
        let name = field?.getLocalizedName();
        if(fieldSpec.treeRank){
            const tableName = fieldSpec.table.name.toLowerCase();
            let treeRank =
                dataModelStorage.ranks[tableName][
                    fieldSpec.treeRank
                ];
            if (typeof treeRank === 'undefined')
                if (
                    dataModelStorage.rootRanks[tableName][0] ===
                    fieldSpec.treeRank
                )
                    treeRank = dataModelStorage.rootRanks[tableName][1];
            name = treeRank?.title ?? name;
        }
        if (fieldSpec.datePart &&  fieldSpec.datePart != 'Full Date') {
            name += ' (' + fieldSpec.datePart + ')';
        }
        var th = $('<th>').text(name);
        icon && th.prepend($('<img>', {src: icon}));
        return th;
    }

    var QueryResultsTable = Backbone.View.extend({
        __name__: "QueryResultsTable",
        className: "query-results-table",
        initialize: function(options) {
            var opNames = "countOnly noHeader fieldSpecs linkField fetchResults fetchCount initialData ajaxUrl scrollElement format";
            _.each(opNames.split(' '), function(option) { this[option] = options[option]; }, this);
            this.gotDataBefore = false;
        },
        renderHeader: function() {
            var header = $('<tr>');
            _.each(this.fieldSpecs, function(f) { header.append(renderHeader(f)); });
            return $('<thead>').append(header);
        },
        render: function() {
            (typeof dataModelPromise === 'undefined'
              ? Promise.resolve()
              : dataModelPromise
            ).then(() => {
              dataModelPromise = undefined;
              this._render();
            });

            return this;
        },
        _render: function() {
            var inner = $(template({queryText}));
            this.$el.append(inner);
            var table = this.$('table.query-results');
            this.$('.query-results-count').text(commonText('loadingInline'));
            this.countOnly || table.append(this.renderHeader());
            this.noHeader && this.$('h3').remove();
            this.$('.fetching-more').hide();

            this.fetchCount && this.fetchCount.done(this.setCount.bind(this));

            if (this.countOnly) return this;

            var results = this.results = new ScrollResults({
                el: this.el,
                scrollElement: this.scrollElement,
                view: new QueryResults({model: this.model,
                                        el: inner,
                                        fieldSpecs: this.fieldSpecs,
                                        format: this.format,
                                        linkField: this.linkField}),
                fetch: this.fetchResults,
                ajaxUrl: this.ajaxUrl,
                initialData: this.initialData
            });
            results.render()
                .on('fetching', this.fetchingMore, this)
                .on('gotdata', this.gotData, this)
                .start();
        },
        setCount: function(data) {
            this.$('.query-results-count').text(data.count);
        },
        remove: function() {
            this.results && this.results.undelegateEvents();
            return Backbone.View.prototype.remove.apply(this, arguments);
        },
        fetchingMore: function() {
            this.$('.fetching-more').show();
        },
        gotData: function() {
            this.$('.fetching-more').hide();
            var el = this.el;
            this.gotDataBefore ||_.defer(function() { el.scrollIntoView(); });
            this.gotDataBefore = true;
        }
    });

module.exports =  QueryResultsTable;

