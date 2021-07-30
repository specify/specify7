"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Q from 'q';
import Backbone from './backbone';


function getPossibleRanks(lowestChildRank, parentTreeDefItem, treeDef) {
    if (!parentTreeDefItem) return _([]);
    const filters = {
        rankid__gt: parentTreeDefItem.get('rankid'),
        treedef: treeDef.id
    };
    if (lowestChildRank != null) filters['rankid__lt'] = lowestChildRank;

    const children = new parentTreeDefItem.specifyModel.LazyCollection({filters: filters, orderby: 'rankID'});
    return children.fetch({limit: 0}).pipe(() => {
        var possibilities = [];
        for (var i = 0; i < children.length; i++) {
            possibilities.push(children.models[i]);
            if (children.models[i].get('isEnforced')) {
                break;
            }
        }
        children.models = possibilities;
        children.length  = possibilities.length;
        children._totalCount = possibilities.length;
        return children;
    });
}

export default Backbone.View.extend({
        __name__: "TreeLevelCBX",
        events: {
            change: 'changed'
        },
        initialize: function() {
            this.model.on('change:parent', this.render, this);
            this.lastFetch = null;
            this.field = this.model.specifyModel.getField(this.$el.attr('name'));
            this.lowestChildRankPromise = this.model.isNew() ? Q(null) : Q(this.model.rget('children'))
                .then(children => Q(children.fetch({ limit: 1, filters: { orderby: 'rankid'}}))
                      .then(() => children.pluck('rankid')[0]));
        },
        render: function() {
            this.$el.empty();
            if (!this.model.get('parent')) {
                this.$el.prop('disabled', true);
                return this;
            }
            this.$el.prop('disabled', false);
            const fetch = this.lastFetch = Q([
                this.lowestChildRankPromise,
                this.model.rget('parent.definitionitem', true),
                this.model.rget('parent.definitionitem.treedef', true)
            ]).spread(getPossibleRanks);

            fetch.done(higherRanks => this.fillIn(fetch, higherRanks));
            return this;
        },
        fillIn: function(fetch, higherRanks) {
            if (fetch !== this.lastFetch) return;

            const fieldName = this.$el.attr('name');
            const value = this.model.get(fieldName);
            const options = higherRanks.map(rank => {
                const url = rank.url();
                return $('<option>', {
                    value: url,
                    selected: url === value
                }).text(rank.get('title') || rank.get('name'))[0];
            });
            this.$el.append(options);
            // # make sure value in the resource is consistent with what is displayed.
            if (!value || this.$el.find(`option[value="${value}"]`).length < 1) {
                this.model.set(fieldName, higherRanks.first());
            }
        },
        changed: function() {
            const selected = this.field.getRelatedModel().Resource.fromUri(this.$el.val());
            this.model.set(this.$el.attr('name'), selected);
        }
    });

