"use strict";

import $ from 'jquery';
import _ from 'underscore';

import {globalEvents} from './specifyapi';
import {schema} from './schema';
import {getDomainResource} from './treedefinitions';
import { remotePrefs } from './remoteprefs';


function takeBetween(items, startElem, endElem) {
        var start = 1 + _.indexOf(items, startElem);
        var end = 1 + _.indexOf(items, endElem);
        return _.rest(_.first(items, end), start);
    }


    globalEvents.on('newresource', function(resource) {
        const domainField = resource.specifyModel.getScopingRelationship();
        const parentResource = domainField && getDomainResource(domainField.name);
        if (parentResource && !resource.get(domainField.name)) {
            resource.set(domainField.name, parentResource.url());
        }

        // need to make sure parentResource isn't null to fix issue introduced by 8abf5d5
        if (resource.specifyModel.name.toLowerCase() === "collectionobject" && parentResource) {
            const colId = parentResource.get('id');
            if (remotePrefs["CO_CREATE_COA_" + colId]  === "true") {
                const coaModel = resource.specifyModel.getField('collectionobjectattribute').relatedModel;
                const coa = new coaModel.Resource();
                coa.placeInSameHierarchy(resource);
                resource.set('collectionobjectattribute', coa);
            }
            if (remotePrefs["CO_CREATE_PREP_" + colId]  === "true") {
                const prepModel = resource.specifyModel.getField('preparations').relatedModel;
                const prep = new prepModel.Resource();
                resource.rget('preparations').done(preps => preps.add(prep));
            }
            if (remotePrefs["CO_CREATE_DET_" + colId]  === "true") {
                const detModel = resource.specifyModel.getField('determinations').relatedModel;
                const det = new detModel.Resource();
                resource.rget('determinations').done(dets => dets.add(det));
            }
        }
    });


        export function collectionsInDomain(domainResource) {
            if (domainResource == null) return null;
            var domainLevel = domainResource.specifyModel.name.toLowerCase();
            if (domainLevel === 'collectionobject') {
                return domainResource.rget('collection', true).pipe(function(collection) {
                    return [collection];
                });
            }
            if (domainLevel === 'collection') {
                return domainResource.fetchIfNotPopulated().pipe(function() {
                    return [domainResource];
                });
            }
            var path = takeBetween(schema.orgHierarchy, 'Collection', domainLevel).map(level=>level.toLowerCase());
            var filter = {};
            filter[path.join('__')] = domainResource.id;
            var collections = new schema.models.Collection.LazyCollection({ filters: filter });
            return collections.fetch({ limit: 0 }).pipe(function() { return collections.models; });
        }
        export function collectionsForResource(resource) {
            var collectionmemberid = resource.get('collectionmemberid');
            if (_.isNumber(collectionmemberid)) {
                var collection = new schema.models.Collection.Resource({ id: collectionmemberid });
                return collection.fetchIfNotPopulated().pipe(function() { return [collection]; });
            }
            var domainField = resource.specifyModel.getScopingRelationship();
            if (domainField) {
                return resource.rget(domainField.name).pipe(collectionsInDomain);
            } else {
                return $.when(null);
            }
        }
