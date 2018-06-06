"use strict";

var $      = require('jquery');
var _      = require('underscore');
var schema = require('./schemabase.js');

    function alwaysTrue() { return true; }

module.exports = {
        Agent: function(model) {
            var fields = model.getAllFields();
            var catalogerOf = _(new schema.Field(model)).extend({
                name: 'catalogerOf',
                isRelationship: true,
                isRequired: false,
                isHidden: alwaysTrue,
                type: 'one-to-many',
                otherSideName: 'Cataloger',
                relatedModelName: 'CollectionObject'
            });
            fields.push(catalogerOf);
        },
        Collection: function(model) {
            var fields = model.getAllFields();
            var collectionObjects = _(new schema.Field(model)).extend({
                name: 'collectionObjects',
                isRelationship: true,
                isRequired: false,
                isHidden: alwaysTrue,
                type: 'one-to-many',
                otherSideName: 'Collection',
                relatedModelName: 'CollectionObject'
            });
            fields.push(collectionObjects);
        },
        CollectionObject: function(model) {
            var collection = model.getField('collection');
            collection.otherSideName = 'collectionObjects';
            var catalognumber = model.getField('catalognumber');
            catalognumber.getFormat = function() {
                return schema.catalogNumFormatName || schema.Field.prototype.getFormat.apply(this);
            };
        },
        Division: function(model) {
            var fields = model.getAllFields();
            var accessions = _(new schema.Field(model)).extend({
                name: 'accessions',
                isRelationship: true,
                isRequired: false,
                isHidden: alwaysTrue,
                type: 'one-to-many',
                otherSideName: 'Division',
                relatedModelName: 'Accession'
            });
            fields.push(accessions);
        },
        Accession: function(model) {
            var division = model.getField('division');
            division.otherSideName = 'accessions';
        },
        PrepType: function(model) {
            var fields = model.getAllFields();
            var preparations = _(new schema.Field(model)).extend({
                name: 'preparations',
                isRelationship: true,
                isRequired: false,
                isHidden: alwaysTrue,
                type: 'one-to-many',
                otherSideName: 'PrepType',
                relatedModelName: 'Preparation'
            });
            fields.push(preparations);
        },
        Preparation: function(model) {
            var fields = model.getAllFields();
            var isOnLoan = _(new schema.Field(model)).extend({
                name: 'isOnLoan',
                isRelationship: false,
                isRequired: false,
                isHidden: alwaysTrue,
                readOnly: true,
                type: 'java.lang.Boolean'
            });
            fields.push(isOnLoan);

            var preptype = model.getField('preptype');
            preptype.otherSideName = 'preparations';
        },
        Taxon: function(model) {
            var fields = model.getAllFields();
            var preferredTaxonOf = _(new schema.Field(model)).extend({
                name: 'preferredTaxonOf',
                isRelationship: true,
                isRequired: false,
                isHidden: alwaysTrue,
                type: 'one-to-many',
                otherSideName: 'preferredTaxon',
                relatedModelName: 'Determination'
            });
            fields.push(preferredTaxonOf);

            var parentField = model.getField('parent');
            parentField.isRequired = true;
            var isAccepted = model.getField('isaccepted');
            isAccepted.readOnly = true;
            var acceptedTaxon = model.getField('acceptedtaxon');
            acceptedTaxon.readOnly = true;
            var fullName = model.getField('fullname');
            fullName.readOnly = true;
        },
        Geography: function(model) {
            var parentField = model.getField('parent');
            parentField.isRequired = true;
            var isAccepted = model.getField('isaccepted');
            isAccepted.readOnly = true;
            var acceptedGeography = model.getField('acceptedgeography');
            acceptedGeography.readOnly = true;
            var fullName = model.getField('fullname');
            fullName.readOnly = true;
        },
        LithoStrat: function(model) {
            var parentField = model.getField('parent');
            parentField.isRequired = true;
            var isAccepted = model.getField('isaccepted');
            isAccepted.readOnly = true;
            var acceptedLithostrat = model.getField('acceptedlithostrat');
            acceptedLithostrat.readOnly = true;
            var fullName = model.getField('fullname');
            fullName.readOnly = true;
        },
        GeologicTimePeriod: function(model) {
            var parentField = model.getField('parent');
            parentField.isRequired = true;
            var isAccepted = model.getField('isaccepted');
            isAccepted.readOnly = true;
            var acceptedGeologictimeperiod = model.getField('acceptedgeologictimeperiod');
            acceptedGeologictimeperiod.readOnly = true;
            var fullName = model.getField('fullname');
            fullName.readOnly = true;
        },
        Storage: function(model) {
            var parentField = model.getField('parent');
            parentField.isRequired = true;
            var isAccepted = model.getField('isaccepted');
            isAccepted.readOnly = true;
            var acceptedStorage = model.getField('acceptedstorage');
            acceptedStorage.readOnly = true;
            var fullName = model.getField('fullname');
            fullName.readOnly = true;
        }
    };

