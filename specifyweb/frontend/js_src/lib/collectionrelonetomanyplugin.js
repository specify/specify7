"use strict";

var $ = require('jquery');
var _ = require('underscore');

var dataobjformatters = require('./dataobjformatters.js');
var navigation        = require('./navigation.js');
var UIPlugin          = require('./uiplugin.js');
var whenAll           = require('./whenall.js');
var schema            = require('./schema.js');

    var format = dataobjformatters.format;

module.exports =  UIPlugin.extend({
        __name__: "CollectionRelOneToManyPlugin",
        events: {
            'click a': 'go'
        },
        render: function() {
            var table = $('<table>').addClass('collectionrelonetomanyplugin');
            this.$el.replaceWith(table);
            this.setElement(table);
            table.append('<tr><th>Collection Object</th><th>Collection</th></tr>');
            this.model.isNew() || this.fillIn();
            return this;
        },
        fillIn: function() {
            var collection = new schema.models.CollectionRelType.LazyCollection({
                filters: { name: this.init.relname }
            });
            collection.fetch({limit: 1})
                .pipe(function() { return collection.first(); })
                .pipe(function(relType) {
                    return $.when(relType, relType.rget('leftsidecollection'), relType.rget('rightsidecollection'));
                }).done(this.gotRelType.bind(this));
        },
        gotRelType: function(relType, leftSideCollection, rightSideCollection) {
            this.relType = relType;
            switch (schema.domainLevelIds.collection) {
            case leftSideCollection.id:
                this.side = 'left';
                this.otherSide = 'right';
                this.otherCollection = rightSideCollection;
                break;
            case rightSideCollection.id:
                this.side = 'right';
                this.otherSide = 'left';
                this.otherCollection = leftSideCollection;
                break;
            default:
                throw new Error("related collection plugin used with relation that doesn't match current collection");
            }
            this.model.rget(this.side + 'siderels').done(this.gotRels.bind(this));
        },
        gotRels: function(related) {
            related.filters.collectionreltype = this.relType.id;

            var otherSide = this.otherSide + 'side';
            related.fetch().pipe(function() {
                return whenAll(related.map(function(rel) {
                    return rel.rget(otherSide, true);
                }));
            }).done(this.gotRelatedObjects.bind(this));
        },
        gotRelatedObjects: function(collectionObjects) {
            var table = this.el;
            var otherCollectionFormatted = format(this.otherCollection);

           _.each(collectionObjects, function(co) {
               var tr = $('<tr>').appendTo(table);
               var label = $('<a>', { href: co.viewUrl() }).appendTo($('<td>').appendTo(tr));
               format(co).done(function(text) { label.text(text); });
               var collection = $('<a>', { href: co.viewUrl() }).appendTo($('<td>').appendTo(tr));
               otherCollectionFormatted.done(function(text) { collection.text(text); });
           });
        },
        go: function(evt) {
            evt.preventDefault();
            navigation.switchCollection(this.otherCollection, $(evt.currentTarget).prop('href'));
        }
    }, { pluginsProvided: ["CollectionRelOneToManyPlugin"] });

