define(['underscore', 'schema'], function(_, schema) {
    "use strict";
    return function() {
        module('schema');
        test('getModel', function() {
            var model = getModel('collectionobject');
            equal(model.name, 'CollectionObject', 'model.name is cannonical');
            equal(model, getModel('CollectionObject'), 'getting model by alternative name');
        });

        test('getModelById', function() {
            var model = getModelById(7);
            equal(model.name, 'Accession');
            equal(model.tableId, 7);
        });

        test('model.veiw', function() {
            var model = getModel('collectionobject');
            ok(_(model.view).isString(), 'model.view is string');
        });

        test('model.fields', function() {
            var fields = getModel('collectionobject').fields;
            ok(_(fields).isArray(), 'model.fields is an array');
            equal(getModel('collectionobject').fields, fields,
                  'subsequent calls return memoized value');
        });

        test('model.getField', function() {
            var model = getModel('collectionobject');
            var field = model.getField('catalognumber');
            ok(_(model.fields).contains(field), 'field in fieldss');
            equal(field.name.toLowerCase(), 'catalognumber', 'got the right field');
            equal(field.model, model, 'the model for the field is correct');
            equal(model.getField('catalogNumber'), field, 'getField is case-insensitive');
        });

        test('model.getField nested', function() {
            var model = getModel('collectionobject');
            var field = model.getField('cataloger.lastname');
            equal(field.name.toLowerCase(), 'lastname', 'got the right field');
            equal(field.model.name.toLowerCase(), 'agent', 'field is in agent model');
        });

        test('model.getLocalizedName', function() {
            var model = getModel('collectionobject');
            var name = model.getLocalizedName();
            ok(_(name).isString(), 'name is string: ' + name);
        });

        test('field.getLocalizedName', function() {
            var field = getModel('collectionobject').getField('cataloger');
            var name = field.getLocalizedName();
            ok(_(name).isString(), 'name is string: ' + name);
        });

        test('field.getLocalizedDesc', function() {
            var field = getModel('collectionobject').getField('cataloger');
            var desc = field.getLocalizedDesc();
            ok(_(desc).isString(), 'desc is string: ' + desc);
        });

        test('regular field attributes', function() {
            var model = getModel('collectionobject');
            var field = model.getField('catalognumber');
            ok(!field.isRelationship, 'catalognumber is not relationship');
            ok(!field.isRequired, 'catalognumber is not required');
            equal(field.type, 'java.lang.String', 'catalognumber is String');
            ok(_.isUndefined(field.otherSideName), 'catalognumber has no othersidename');
            throws(function() { field.getRelatedModel(); }, 'getRelatedModel throws error');
        });

        test('relationship field attributes', function () {
            var model = getModel('collectionobject');
            var field = model.getField('collectingevent');
            ok(field.isRelationship, 'collectingevent is relationship field');
            ok(!field.isRequired, 'not required');
            equal(field.name.toLowerCase(), 'collectingevent', 'names match');
            equal(field.type, 'many-to-one', 'is many-to-one field');
            equal(field.otherSideName.toLowerCase(), 'collectionobjects', 'othersidename matches');
            equal(field.getRelatedModel(), getModel('collectingevent'), 'getRelatedModel works');
        });

        test('field sets for models get confused', function() {
            var fields1 = getModel('collectionobject').fields;
            var fields2 = getModel('agent').fields;
            notEqual(fields1, fields2);
        });
    };
});
