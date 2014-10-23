define([
    'jquery', 'underscore', 'backbone', 'dataobjformatters', 'fieldformat', 'uiparse',
    'uiinputfield', 'saveblockers', 'tooltipmgr', 'dateformat'
], function(
    $, _, Backbone, dataobjformatters, fieldformat, uiparse,
    UIFieldInput, saveblockers, ToolTipMgr, dateFormatStr) {
    "use strict";
    var objformat = dataobjformatters.format;

    return Backbone.View.extend({
        __name__: "UIField",
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
            if (!resource) {
                console.error("resource doesn't exist");
                return;
            }
            var remote = _.isNull(resource) || resource != this.model;

            var readOnly = remote || field.isRelationship || this.$el.prop('readonly');

            var fieldName = this.fieldName = field.name.toLowerCase();

            var formatter = field.getUIFormatter();

            field.isRelationship && this.$el.removeClass('specify-field').addClass('specify-object-formatted');
            field.isRequired && this.$el.addClass('specify-required-field');

            var inputUI = new UIFieldInput({
                el: this.el,
                readOnly: readOnly,
                noValidation: this.model.noValidation,
                formatter: formatter,
                parser: uiparse.bind(null, field)
            }).render()
                    .on('changed', this.inputChanged, this)
                    .on('addsaveblocker', this.addSaveBlocker, this)
                    .on('removesaveblocker', this.removeSaveBlocker, this);

            if (resource.isNew() && this.$el.val()) {
                console.log('setting default value', this.$el.val(), 'into', field);
                inputUI.fillIn(this.$el.val()).change();
            }

            if (resource) {
                var fillItIn = function() {
                    var format = field.isRelationship ? objformat : _.bind(fieldformat, null, field);

                    resource.rget(fieldName).pipe(format).done(function(value) {
                        inputUI.fillIn(value);
                    });
                };

                fillItIn();
                resource.on('change:' + fieldName, fillItIn);
            }

            if (readOnly) return;

            if (!this.model.noValidation) {
                this.toolTipMgr = new ToolTipMgr(this).enable();
                this.saveblockerEnhancement = new saveblockers.FieldViewEnhancer(this, fieldName);
            }

            if (this.model.isNew()) {
                var autoNumberValue = formatter && formatter.canAutonumber() && formatter.value();
                autoNumberValue && this.model.set(this.fieldName, autoNumberValue);

                inputUI.validate(true); // validate any default value and defer result
            }
        },
        inputChanged: function(value) {
            this.model.set(this.fieldName, value);
        },
        addSaveBlocker: function(key, message, deferred) {
            this.model.saveBlockers.add(key + ':' + this.fieldName, this.fieldName, message, deferred);
        },
        removeSaveBlocker: function(key) {
            this.model.saveBlockers.remove(key + ':' + this.fieldName);
        }
    });
});
