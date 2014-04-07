define([
    'jquery', 'underscore', 'backbone', 'dataobjformatters', 'fieldformat', 'uiparse',
    'saveblockers', 'tooltipmgr'
], function($, _, Backbone, dataobjformatters, fieldformat, uiparse, saveblockers, ToolTipMgr) {
    "use strict";
    var objformat = dataobjformatters.format;

    var UIField = Backbone.View.extend({
        __name__: "UIField",
        events: {
            'change': 'change'
        },
        render: function() {
            var render = _.bind(this._render, this);
            var fieldName = this.$el.attr('name');
            if (!fieldName) {
                console.error("missing field name", this.el);
                return this;
            }
            this.model.getResourceAndField(fieldName).done(render);
            return this;
        },
        _render: function(resource, field) {
            if (!field) {
                console.error('unknown field', this.$el.attr('name'), 'in', this.model, 'element:', this.$el);
                return;
            }
            var remote = _.isNull(resource) || resource != this.model;

            this.readOnly = remote || field.isRelationship || this.$el.prop('readonly');
            this.readOnly && this.$el.prop('readonly', true);

            var fieldName = this.fieldName = field.name.toLowerCase();
            this.field = field;

            field.isRelationship && this.$el.removeClass('specify-field').addClass('specify-object-formatted');

            field.isRequired && this.$el.addClass('specify-required-field');

            this.formatter = this.field.getUIFormatter();
            this.formatter && this.$el.attr('title', 'Format: ' + this.formatter.value());

            resource.isNew() && this.$el.val() && this.change(); // set default value into resource;

            var setControl =_(this.$el.val).bind(this.$el);
            var format = field.isRelationship ? objformat : _.bind(fieldformat, null, field);

            var fillItIn = function() {
                resource && resource.rget(fieldName).pipe(format).then(setControl);
            };

            fillItIn();
            resource && resource.on('change:' + fieldName, fillItIn);
            if (this.readOnly) return;

            if (!this.model.noValidation) {
                this.toolTipMgr = new ToolTipMgr(this).enable();
                this.saveblockerEnhancement = new saveblockers.FieldViewEnhancer(this, fieldName);
            }

            if (this.model.isNew()) {
                if (this.formatter && this.formatter.canAutonumber())
                {
                    this.model.set(this.fieldName, this.formatter.value());
                }
                this.validate(true);
            }
        },
        validate: function(deferred) {
            var value = this.$el.val().trim();
            if (this.model.noValidation) {
                return { parsed: value };
            }

            var isRequired = this.$el.is('.specify-required-field');
            if (value === '' && isRequired) {
                this.addSaveBlocker('fieldrequired', "Field is required.", deferred);
                return undefined;
            } else {
                this.removeSaveBlocker('fieldrequired');
            }

            if (this.formatter) {
                var formatterVals = this.formatter.parse(value);
                if (!formatterVals) {
                    this.addSaveBlocker('badformat', "Required format: " + this.formatter.value(), deferred);
                    return undefined;
                } else {
                    this.removeSaveBlocker('badformat');
                    value = this.formatter.canonicalize(formatterVals);
                }
            }

            var parseResult = uiparse(this.field, value);
            if (!parseResult.isValid) {
                this.addSaveBlocker('cantparse', parseResult.reason, deferred);
                return undefined;
            } else {
                this.removeSaveBlocker('cantparse');
                return parseResult;
            }
        },
        change: function() {
            if (this.readOnly) return;
            var result = this.validate();
            if (_.isUndefined(result)) return;

            this.model.set(this.fieldName, result.parsed);
            if (!this.field.isRelationship)
                this.$el.val(fieldformat(this.field, result.parsed));
        },
        addSaveBlocker: function(key, message, deferred) {
            this.model.saveBlockers.add(key + ':' + this.fieldName, this.fieldName, message, deferred);
        },
        removeSaveBlocker: function(key) {
            this.model.saveBlockers.remove(key + ':' + this.fieldName);
        }
    });

    return UIField;
});
