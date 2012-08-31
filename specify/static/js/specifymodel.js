define([
    'jquery', 'underscore', 'icons', 'schemabase',
    'text!context/schema_localization.json!noinline'
], function($, _, icons, schema, slJSON) {
    "use strict";
    var localization = $.parseJSON(slJSON);

    schema.Model = function(node) {
        this.node = $(node);
        this.longName = this.node.attr('classname');
        this.name = this.longName.split('.').pop();
        var display = this.node.find('display');
        this.view = display.attr('view');
        this.searchDialog = display.attr('searchdlg');
        this.tableId = parseInt(this.node.attr('tableid'), 10);
        this.jpaID = this.node.find('id').attr('name');
        this._localization = localization[this.name.toLowerCase()];
    };
    _.extend(schema.Model.prototype, {
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
                self.node.find('field, relationship').map(function() {
                    return new schema.Field(self, this);
                }));
            return self.fields;
        },
        getLocalizedName: function() {
            return this._localization.name;
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

    return schema;
});
