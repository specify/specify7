"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';


import ScrollResults from './scrollresults';
import QueryResults from './queryresults';
import {getTreeDef} from './domain';
import queryText from './localization/query';
import commonText from './localization/common';

async function getTreeRanks(tableName){
    const treeDef = await getTreeDef(tableName);
    const treeDefItems = await treeDef.rget('treedefitems');
    await treeDefItems.fetch({limit: 0});
    return treeDefItems.models;
}

    function renderHeader(fieldSpec) {
        const field = _.last(fieldSpec.joinPath);
        const icon = field && field.model.getIcon();
        let name = field?.getLocalizedName();

        const th = $(`<div role="columnheader"
            class="bg-brand-100 border-b border-gray-500 p-1"
        >
          <div class="v-center">
              <span class="v-center"></span>
          </div>
        </div>`);
        const div = th.find('div');
        const span = div.find('span');

        // If it is a tree rank, display rank name while fetching rank title
        span.text(name ?? fieldSpec.treeRank);

        if(fieldSpec.treeRank)
            getTreeRanks(fieldSpec.table.name)
                .then(treeRanks=>
                    treeRanks.find(item=>
                        item.get('name')===fieldSpec.treeRank
                    )
                )
                .then(treeRank=>treeRank.get('title') ?? fieldSpec.treeRank)
              .then(title=>span.text(title));

        else if (fieldSpec.datePart && fieldSpec.datePart !== 'fullDate')
            span.text(`${name} (${fieldSpec.datePart})`);

        icon && div.prepend($('<img>', {
            src: icon,
            alt: '',
            class: 'w-table-icon',
        }));
        return th;
    }

    export default Backbone.View.extend({
        __name__: "QueryResultsTable",
        className: "bg-gray-200 p-4 shadow-[0_3px_5px_-1px] shadow-gray-500 rounded",
        initialize: function(options) {
            var opNames = "countOnly noHeader fieldSpecs linkField fetchResults fetchCount initialData ajaxUrl scrollElement format";
            _.each(opNames.split(' '), function(option) { this[option] = options[option]; }, this);
            this.gotDataBefore = false;
        },
        render: function() {
            this.el.innerHTML = `
                ${this.noHeader
                    ? ''
                    : `<h3 class="query-results-count">
                        ${queryText('results')(commonText('loadingInline'))}
                    </h3>`
                }
                ${this.countOnly
                    ? ''
                    : `<div
                        role="table"
                        class="grid-table"
                        style="
                            grid-template-columns: repeat(${this.fieldSpecs.length}, auto);
                        "
                    >
                        <div role="rowgroup">
                            <div role="row" class="header-container"></div>
                        </div>
                        <div role="rowgroup" class="query-results"></div>
                    </div>`
                }
                <div class="fetching-more" style="display: none;">
                    <img
                        src="/static/img/specify128spinner.gif"
                        alt="${commonText('loading')}"
                        class="w-10"
                    >
                </div>`;

            this.$('.header-container').append(
                this.fieldSpecs.map(renderHeader)
            );

            this.el.setAttribute('aria-live','polite');

            this.fetchCount && this.fetchCount.done(this.setCount.bind(this));

            if (this.countOnly) return this;

            this.results = new ScrollResults({
                el: this.el,
                scrollElement: this.scrollElement,
                view: new QueryResults({model: this.model,
                                        el: this.el,
                                        fieldSpecs: this.fieldSpecs,
                                        format: this.format,
                                        linkField: this.linkField}),
                fetch: this.fetchResults,
                ajaxUrl: this.ajaxUrl,
                initialData: this.initialData
            });
            this.results.render()
                .on('fetching', this.fetchingMore, this)
                .on('gotdata', this.gotData, this)
                .start();

            return this;
        },
        setCount: function(data) {
            this.$('.query-results-count').text(queryText('results')(data.count));
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
