"use strict";

const $ = require('jquery');
const _ = require('underscore');

const dataobjformatters = require('./dataobjformatters.js');
const navigation        = require('./navigation.js');
const UIPlugin          = require('./uiplugin.js');
const whenAll           = require('./whenall.js');
const schema            = require('./schema.js');
const userInfo          = require('./userinfo.js');

const format = dataobjformatters.format;

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
            
            var relModel = schema.getModel('CollectionRelationship');
            var filters = this.side == 'left' ? {leftside_id: this.model.id, collectionreltype_id: this.relType.id}
                : {rightside_id: this.model.id, collectionreltype_id: this.relType.id};
            var items = new relModel.LazyCollection({filters: filters});
            items.fetch().done(this.gotRels.bind(this, items));
        },
    gotRels: function(related) {
        var otherSide = this.otherSide + 'side';
        related.fetch().pipe(function() {
            return whenAll(_.map(related.models, function(rel) {
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
            const collections = userInfo.available_collections.map(c => c[0]);
            if (collections.includes(this.otherCollection.id)) {
                navigation.switchCollection(this.otherCollection, $(evt.currentTarget).prop('href'));
            } else {
                $('<div>').text(
                    `You do not have access to the collection ${this.otherCollection.get('collectionname')}
 through the currently logged in account.`
                ).dialog({
                    title: "Access denied.",
                    close() { $(this).remove(); },
                    buttons: {
                        Ok() { $(this).dialog('close'); }
                    }
                });
            }
        }
    }, { pluginsProvided: ["CollectionRelOneToManyPlugin"] });

