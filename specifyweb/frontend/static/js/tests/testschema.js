define(['underscore', 'schema'], function(_, schema) {
    "use strict";
    return function() {
        module('schema');
        test('getModel', function() {
            var model = schema.getModel('collectionobject');
            equal(model.name, 'CollectionObject', 'model.name is cannonical');
            equal(model, schema.getModel('CollectionObject'), 'getting model by alternative name');
        });

        test('getModelById', function() {
            var model = schema.getModelById(7);
            equal(model.name, 'Accession');
            equal(model.tableId, 7);
        });

        test('model.veiw', function() {
            var model = schema.getModel('collectionobject');
            ok(_(model.view).isString(), 'model.view is string');
        });

        test('model.getAllFields', function() {
            var fields = schema.getModel('collectionobject').getAllFields();
            ok(_(fields).isArray(), 'model.getAllFields returns array');
            equal(schema.getModel('collectionobject').getAllFields(), fields,
                  'subsequent calls return memoized value');
        });

        test('model.getField', function() {
            var model = schema.getModel('collectionobject');
            var field = model.getField('catalognumber');
            ok(_(model.getAllFields()).contains(field), 'field in getAllFields');
            equal(field.name.toLowerCase(), 'catalognumber', 'got the right field');
            equal(field.model, model, 'the model for the field is correct');
            equal(model.getField('catalogNumber'), field, 'getField is case-insensitive');
        });

        test('model.getField nested', function() {
            var model = schema.getModel('collectionobject');
            var field = model.getField('cataloger.lastname');
            equal(field.name.toLowerCase(), 'lastname', 'got the right field');
            equal(field.model.name.toLowerCase(), 'agent', 'field is in agent model');
        });

        test('model.getLocalizedName', function() {
            var model = schema.getModel('collectionobject');
            var name = model.getLocalizedName();
            ok(_(name).isString(), 'name is string: ' + name);
        });

        test('field.getLocalizedName', function() {
            var field = schema.getModel('collectionobject').getField('cataloger');
            var name = field.getLocalizedName();
            ok(_(name).isString(), 'name is string: ' + name);
        });

        test('field.getLocalizedDesc', function() {
            var field = schema.getModel('collectionobject').getField('cataloger');
            var desc = field.getLocalizedDesc();
            ok(_(desc).isString(), 'desc is string: ' + desc);
        });

        test('regular field attributes', function() {
            var model = schema.getModel('collectionobject');
            var field = model.getField('catalognumber');
            ok(!field.isRelationship, 'catalognumber is not relationship');
            ok(!field.isRequired, 'catalognumber is not required');
            equal(field.type, 'java.lang.String', 'catalognumber is String');
            ok(_.isUndefined(field.otherSideName), 'catalognumber has no othersidename');
            throws(function() { field.getRelatedModel(); }, 'getRelatedModel throws error');
        });

        test('relationship field attributes', function () {
            var model = schema.getModel('collectionobject');
            var field = model.getField('collectingevent');
            ok(field.isRelationship, 'collectingevent is relationship field');
            ok(!field.isRequired, 'not required');
            equal(field.name.toLowerCase(), 'collectingevent', 'names match');
            equal(field.type, 'many-to-one', 'is many-to-one field');
            equal(field.otherSideName.toLowerCase(), 'collectionobjects', 'othersidename matches');
            equal(field.getRelatedModel(), schema.getModel('collectingevent'), 'getRelatedModel works');
        });

        test('field sets for models get confused', function() {
            var fields1 = schema.getModel('collectionobject').getAllFields();
            var fields2 = schema.getModel('agent').getAllFields();
            notEqual(fields1, fields2);
        });
    };
});
