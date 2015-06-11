define(['underscore', 'schemabase'], function(_, schema) {
    "use strict";

    return {
        Agent: function(model) {
            var fields = model.getAllFields();
            var catalogerOf = _(new schema.Field(model)).extend({
                name: 'catalogerOf',
                isRelationship: true,
                isRequired: false,
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
                type: 'one-to-many',
                otherSideName: 'Collection',
                relatedModelName: 'CollectionObject'
            });
            fields.push(collectionObjects);
        },
        CollectionObject: function(model) {
            var collection = model.getField('collection');
            collection.otherSideName = 'collectionObjects';
        },
        Division: function(model) {
            var fields = model.getAllFields();
            var accessions = _(new schema.Field(model)).extend({
                name: 'accessions',
                isRelationship: true,
                isRequired: false,
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
                type: 'java.lang.Boolean'
            });
            fields.push(isOnLoan);

            var preptype = model.getField('preptype');
            preptype.otherSideName = 'preparations';
        }
    };
});
