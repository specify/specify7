"use strict";

import $ from 'jquery';
import _ from 'underscore';

import {format} from './dataobjformatters';
import * as navigation from './navigation';
import {UiPlugin} from './uiplugin';
import whenAll from './whenall';
import { schema } from './schema';
import {userInformation} from './userinfo';
import QueryCbxSearch from './querycbxsearch';

import formsText from './localization/forms';
import commonText from './localization/common';
import {legacyNonJsxIcons} from './components/icons';

export default UiPlugin.extend({
    __name__: "CollectionRelOneToManyPlugin",
    events: {
        'click a.sp-rel-plugin-other-side': 'go',
        'click button.sp-rel-plugin-remove': 'remove',
        'click button.sp-rel-plugin-add': 'add'
    },
    remove: function(evt) {
        var idx = this.$('button').filter(".sp-rel-plugin-remove").index(evt.currentTarget);
        var toRemove = this.items.models[idx];
        this.model.dependentResources[this.side + 'siderels'].remove(toRemove);
        this.items.remove(toRemove);
        this.$('tr').filter(".sp-rel-plugin-" + this.relType.id)[idx].remove();
    },
    add: function() {
        console.info("add");
        this.openSearch();
    },
    openSearch: function() {
        var self = this;

        if (self.dialog) {
            // if the open dialog is for search just close it and don't open a new one
            var closeOnly = self.dialog.hasClass('querycbx-dialog-search');
            self.dialog.dialog('close');
            if (closeOnly) return;
        }

        var searchTemplateResource = new schema.models.CollectionObject.Resource({}, {
            noBusinessRules: true,
            noValidation: true
        });
        
        self.dialog = new QueryCbxSearch({
            populateForm:this. populateForm,
            forceCollection: self.otherCollection,
            model: searchTemplateResource,
            selected: function(resource) {
                var toAdd = new schema.models.CollectionRelationship.Resource();
                toAdd.set(self.otherSide + 'Side', resource);
                toAdd.set(self.side + 'Side', self.model);
                toAdd.set('collectionreltype', self.relType);
                self.model.dependentResources[self.side + 'siderels'].add(toAdd);
                self.items.add(toAdd);
                self.addElForRelatedObj(resource, format(self.otherCollection));
            }
        }).render().$el.on('remove', function() { self.dialog = null; });
        
        
    }, 
    render: function() {
        var table = $('<table>');
        this.$el.replaceWith(table);
        this.setElement(table);
        table.append(`<tr>
            <th>${formsText('collectionObject')}</th>
            <th>${commonText('collection')}</th>
        </tr>`);
        var footer = $('<tfoot>').appendTo(table);
        $('<button>', {class: "link sp-rel-plugin-add", type:'button', title: commonText('add'), ariaLabel: commonText('add')})
            .append(legacyNonJsxIcons.plus)
            .appendTo(footer);
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
        
        var relModel = schema.models.CollectionRelationship;
        var filters = this.side == 'left' ? {leftside_id: this.model.id, collectionreltype_id: this.relType.id}
            : {rightside_id: this.model.id, collectionreltype_id: this.relType.id};
        this.items = new relModel.LazyCollection({filters: filters});
        this.items.fetch().done(this.gotRels.bind(this, this.items));
    },
    gotRels: function(related) {
        var otherSide = this.otherSide + 'side';
        whenAll(_.map(related.models, function(rel) {
            return rel.rget(otherSide, true);
        })).done(this.gotRelatedObjects.bind(this));
    },
    addElForRelatedObj: function(co, otherColFormatted) {
        var table = this.el;
        var rowClass = {class: "sp-rel-plugin-" + this.relType.id};
        var tr = $('<tr>', rowClass).appendTo(table);
        var label = $('<a>', { class: "sp-rel-plugin-other-side", href: co.viewUrl() }).appendTo($('<td>').appendTo(tr));
        format(co).done(function(text) { label.text(text); });
        var collection = $('<a>', { href: co.viewUrl() }).appendTo($('<td>').appendTo(tr));
        otherColFormatted.then(function(text) { collection.text(text); });
        $('<button>', {class: "sp-rel-plugin-remove button", type:'button', title: commonText('remove'), ariaLabel: commonText('remove')})
          .append(legacyNonJsxIcons.trash)
          .appendTo(
            $('<td>', { class: "remove"}).appendTo(tr)
          );
    },
    gotRelatedObjects: function(collectionObjects) {
        var otherCollectionFormatted = format(this.otherCollection);
        var self = this;
        _.each(collectionObjects, function(co) {
            self.addElForRelatedObj(co, otherCollectionFormatted);
        });
    },
    go: function(evt) {
        evt.preventDefault();
        const collections = userInformation.available_collections.map(c => c[0]);
        if (collections.includes(this.otherCollection.id)) {
            navigation.switchCollection(this.otherCollection.id, $(evt.currentTarget).prop('href'));
        } else {
            $(`<div aria-live="assertive">
                ${commonText('collectionAccessDeniedDialogHeader')}
                <p>${commonText('collectionAccessDeniedDialogMessage')(
                  this.otherCollection.get('collectionname')
                )}</p>
            </div>`).dialog({
                title: commonText('collectionAccessDeniedDialogTitle'),
                close() { $(this).remove(); },
                buttons: {
                    [commonText('close')]() { $(this).dialog('close'); }
                }
            });
        }
    }
}, { pluginsProvided: ["CollectionRelOneToManyPlugin"] });

