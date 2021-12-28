"use strict";

import _ from 'underscore';
import Immutable from 'immutable';

import {getIcon} from './icons';
import schema from './schemabase';
import ResourceBase from './resourceapi';
import collectionapi from './collectionapi';
import {load} from './initialcontext';


// The schema config / localization information is loaded dynamically.
let localization;
export const fetchContext = load('/context/schema_localization.json', 'application/json').then(data => {localization = Immutable.fromJS(data)});

// Define a JS object constructor to represent Specify data objects.
schema.Model = function(tableDef) {
    this.longName = tableDef.classname; // Basically the Java classname of the Specify 6 ORM object.
    this.name = this.longName.split('.').pop();
    this.idFieldName = tableDef.idFieldName;
    this.view = tableDef.view;
    this.searchDialog = tableDef.searchDialog;
    this.tableId = tableDef.tableId;
    this.system = tableDef.system; // Indicates the model is a system table.
    this._fieldAliases = tableDef.fieldAliases;

    // A Backbone model resource for accessing the API for items of this type.
    this.Resource = ResourceBase.extend({ __name__: this.name + 'Resource' },
                                        { specifyModel: this });

    // A Backbone collection for lazy loading a collection of items of this type.
    this.LazyCollection = collectionapi.Lazy.extend({ __name__: this.name + 'LazyCollection',
                                                      model: this.Resource });

    // A Backbone collection for loading a fixed collection of items of this type.
    this.StaticCollection = collectionapi.Static.extend({ __name__: this.name + 'StaticCollection',
                                                          model: this.Resource });

    // A Backbone collection for loading a dependent collection of items of this type as a
    // -to-many collection of some other resource.
    this.DependentCollection = collectionapi.Dependent.extend({ __name__: this.name + "DependentCollection",
                                                                model: this.Resource });

    // A Backbone collection for loading a collection of items of this type as a backwards
    // -to-one collection of some other resource.
    this.ToOneCollection = collectionapi.ToOne.extend({ __name__: this.name + 'ToOneCollection',
                                                        model: this.Resource });

    this.fields = tableDef.fields.map(fieldDef => new schema.Field(this, fieldDef))
        .concat(tableDef.relationships.map(relDef =>  new schema.Relationship(this, relDef)));
};

// Methods on the model objects.
_.extend(schema.Model.prototype, {

    // Convenience function to access the schema localization for this table.
    _getLocalization() {
        return localization.get(this.name.toLowerCase());
    },

    // Return a field object representing the named field of this model.
    // name can be either a dotted name string or an array and will traverse
    // relationships.
    getField(name) {
        if (_(name).isString()) {
            name = name.toLowerCase().split('.');
        }
        let field = _(this.getAllFields()).find(field => field.name.toLowerCase() === name[0]);

        // If we can't find the field by name, try looking for aliases.
        if (_(field).isUndefined()) {
            const alias = _.find(this._fieldAliases, alias => alias.vname.toLowerCase() === name[0]);
            field = alias && this.getField(alias.aname);
        }
        return name.length === 1 ? field : field.getRelatedModel().getField(_(name).tail());
    },

    getAllFields () {
        return this.fields;
    },

    // Try and return the localized name from the schema localization. If there is no
    // localization information just return the name.
    getLocalizedName() {
        const l = this._getLocalization();
        return l ? schema.unescape(l.get('name')) : this.name;
    },


    getFormat() {
        const l = this._getLocalization();
        return l && l.get('format');
    },

    getAggregator() {
        const l = this._getLocalization();
        return l && l.get('aggregator');
    },

    getIcon() {
        return getIcon(this.name.toLowerCase());
    },

    // Perhaps should be renamed to getScopingRelationship.
    // Returns the relationship field of this model that places it in
    // the collection -> discipline -> division -> institution scoping
    // hierarchy.
    orgRelationship() {
        return _.chain(schema.orgHierarchy)
            .map(this.getField, this)
            .filter(field => field && field.type === 'many-to-one')
            .first().value();
    },

    // Perhaps should be renamed to getScopingPath.
    // Returns a list of relationship field names traversing the
    // scoping hierarchy.
    orgPath() {
        if (this.name.toLowerCase() === _.last(schema.orgHierarchy)) return [];
        const up = this.orgRelationship();
        if (up) {
            const path = up.getRelatedModel().orgPath();
            path.push(up.name);
            return path;
        }
        return undefined;
    },

    isHidden() {
        const l = this._getLocalization();
        return l?.get('ishidden') === 1;
    }
});

export default schema;

