"use strict";

const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('./backbone.js');


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
        return children;});
}

module.exports = Backbone.View.extend({
        __name__: "TreeLevelCBX",
        events: {
            change: 'changed'
        },
        initialize: function(options) {
            this.model.on('change:parent', this.render, this);
            this.lastFetch = null;
            this.field = this.model.specifyModel.getField(this.$el.attr('name'));
            this.lowestChildRankPromise = this.model.isNew() ? $.when(null) :
                this.model.rget('children').pipe(function(children) {
                    return children
                        .fetch({ limit: 1, filters: { orderby: 'rankid'}})
                        .pipe(function() {
                            return children.pluck('rankid')[0];
                        });
                });
        },
        render: function() {
            this.$el.empty();
            if (!this.model.get('parent')) {
                this.$el.prop('disabled', true);
                return this;
            }
            this.$el.prop('disabled', false);
            var fetch = this.lastFetch = $.when(
                this.lowestChildRankPromise,
                this.model.rget('parent.definitionitem', true),
                this.model.rget('parent.definitionitem.treedef', true)
            ).pipe(getPossibleRanks);

            fetch.done(this.fillIn.bind(this, fetch));
            return this;
        },
        fillIn: function(fetch, higherRanks) {
            if (fetch !== this.lastFetch) return;

            var fieldName = this.$el.attr('name');
            var value = this.model.get(fieldName);
            var options = higherRanks.map(function(rank) {
                var url = rank.url();
                return $('<option>', {
                    value: url,
                    selected: url === value
                }).text(rank.get('name'))[0];
            });
            this.$el.append(options);
            // # make sure value in the resouce is consitent with what is displayed.
            if (!value || this.$el.find('option[value="' + value + '"]').length < 1) {
                this.model.set(fieldName, higherRanks.first());
            }
        },
        changed: function() {
            var selected = this.field.getRelatedModel().Resource.fromUri(this.$el.val());
            this.model.set(this.$el.attr('name'), selected);
        }
    });

