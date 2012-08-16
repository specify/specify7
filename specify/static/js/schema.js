define([
    'jquery', 'underscore', 'schemalocalization', 'icons', 'uiformatters',
    'text!resources/specify_datamodel.xml'
], function($, _, schemalocalization, icons, UIFormatter, xml) {
    "use strict";

    var Model = function(node) {
        this.node = $(node);
        this.longName = this.node.attr('classname');
        this.name = this.longName.split('.').pop();
        var display = this.node.find('display');
        this.view = display.attr('view');
        this.searchDialog = display.attr('searchdlg');
        this.tableId = parseInt(this.node.attr('tableid'), 10);
        this.jpaID = this.node.find('id').attr('name');
    };
    _.extend(Model.prototype, {
        getField: function(name) {
            if (_(name).isString()) {
                name = name.toLowerCase().split('.');
            }
            var field = _(this.getAllFields()).find(function(field) { return field.name.toLowerCase() === name[0]; });
            if (_(field).isUndefined()) {
                var alias = _(this.node.find('fieldalias')).find(function(alias) {
                    return $(alias).attr('vname').toLowerCase() === name[0];
                });
                field = alias && this.getField($(alias).attr('aname'));
            }
            return name.length === 1 ? field : field.getRelatedModel().getField(_(name).tail());
        },
        getAllFields: function () {
            var self = this;
            self.fields = self.fields || _.toArray(
                self.node.find('field, relationship').map(function() { return new Field(self, this); })
            );
            return self.fields;
        },
        getLocalizedName: function() {
            return schemalocalization.getLocalizedLabelForModel(this.name);
        },
        getIcon: function() {
            return icons.getIcon(this.name);
        },
        orgRelationship: function() {
            return _.chain(schema.orgHierarchy).map(this.getField, this).filter(function(field) {
                return field && field.type === 'many-to-one';
            }).first().value();
        },
        orgPath: function() {
            if (this.name.toLowerCase() === _.last(schema.orgHierarchy)) return [];
            var up = this.orgRelationship();
            if (up) {
                var path = up.getRelatedModel().orgPath();
                path.push(up.name);
                return path;
            }
        }
    });

    function handleSpecialCases(model) {
        var specialCase = {
            Collection: function() {
                var fields = model.getAllFields();
                var collectionObjects = _(new Field(model)).extend({
                    name: 'collectionObjects',
                    isRelationship: true,
                    isRequired: false,
                    type: 'one-to-many',
                    otherSideName: 'Collection',
                    relatedModelName: 'CollectionObject'
                });
                fields.push(collectionObjects);
            },
            CollectionObject: function() {
                var collection = model.getField('collection');
                collection.otherSideName = 'collectionObjects';
            },
            Division: function() {
                var fields = model.getAllFields();
                var accessions = _(new Field(model)).extend({
                    name: 'accessions',
                    isRelationship: true,
                    isRequired: false,
                    type: 'one-to-many',
                    otherSideName: 'Division',
                    relatedModelName: 'Accession'
                });
                fields.push(accessions);
            },
            Accession: function() {
                var division = model.getField('division');
                division.otherSideName = 'accessions';
            },
            PrepType: function() {
                var fields = model.getAllFields();
                var preparations = _(new Field(model)).extend({
                    name: 'preparations',
                    isRelationship: true,
                    isRequired: false,
                    type: 'one-to-many',
                    otherSideName: 'PrepType',
                    relatedModelName: 'Preparation'
                });
                fields.push(preparations);
            },
            Preparation: function() {
                var preptype = model.getField('preptype');
                preptype.otherSideName = 'preparations';
            }
        };
        var dispatch = specialCase[model.name];
        dispatch && dispatch();
    }

    var Field = function(model, node) {
        this.model = model;
        if (!node) return;
        this.node = $(node);
        this.name = this.node.attr('name') || this.node.attr('relationshipname');
        this.isRelationship = this.node.is('relationship');
        this.isRequired = this.node.attr('required') === 'true';
        this.type = this.node.attr('type');
        this.length = this.node.attr('length');
        if (this.isRelationship) {
            this.otherSideName = this.node.attr('othersidename');
            this.relatedModelName = this.node.attr('classname').split('.').pop();
        }
    };
    _.extend(Field.prototype, {
        getRelatedModel: function() {
            if (!this.isRelationship) return undefined;
            return schema.getModel(this.relatedModelName);
        },
        getLocalizedName: function() {
            return schemalocalization.getLocalizedLabelForField(this.name, this.model.name);
        },
        getLocalizedDesc: function() {
            return schemalocalization.getLocalizedDescForField(this.name, this.model.name);
        },
        getFormat: function() {
            return schemalocalization.getFormatForField(this.name, this.model.name);
        },
        getUIFormatter: function() {
            this._uiformatter = this._uiformatter || UIFormatter.forField(this);
            return this._uiformatter;
        }
    });

    var schema = {
        models: {},
        getModel: function(name) {
            name = name.toLowerCase();
            return _(this.models).find(function(model) { return model.name.toLowerCase() === name; });
        },
        getModelById: function(tableId) {
            return _(this.models).find(function(model) { return model.tableId === tableId; });
        },
        orgHierarchy: ['collectionobject', 'collection', 'discipline', 'division', 'institution']
    };

    $('table', $.parseXML(xml)).each(function() {
        var model = new Model(this);
        handleSpecialCases(model);
        schema.models[model.name] = model;
    });

    return schema;
});