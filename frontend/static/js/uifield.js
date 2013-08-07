define([
    'jquery', 'underscore', 'backbone', 'dataobjformatters', 'cs!fieldformat', 'uiparse',
    'cs!saveblockers', 'cs!tooltipmgr'
], function($, _, Backbone, dataobjformatters, fieldformat, uiparse, saveblockers, ToolTipMgr) {
    "use strict";
    var objformat = dataobjformatters.format;

    var UIField = Backbone.View.extend({
        __name__: "UIField",
        events: {
            'change': 'change'
        },
        render: function() {
            var self = this;
            var fieldName = self.$el.attr('name');
            var field = self.model.specifyModel.getField(fieldName);
            if (!field) return self;
            self.fieldName = fieldName;
            self.field = field;

            if (field.isRelationship) {
                self.$el.removeClass('specify-field').addClass('specify-object-formatted');
                self.$el.prop('readonly', true);
            }

            field.isRequired && self.$el.addClass('specify-required-field');

            self.formatter = self.field.getUIFormatter();
            self.formatter && self.$el.attr('title', 'Format: ' + self.formatter.value());

            var fetch = function() {
                return self.model.rget(fieldName).pipe(function(value) {
                    return field.isRelationship ? objformat(value) :
                        fieldformat(field, value);
                });
            };

            var setControl =_(self.$el.val).bind(self.$el);

            var fillItIn = function() { fetch().done(setControl); };

            fillItIn();
            self.model.onChange(fieldName, fillItIn);

            if (!self.model.noValidation) {
                self.toolTipMgr = new ToolTipMgr(self).enable();
                self.saveblockerEnhancement = new saveblockers.FieldViewEnhancer(self, fieldName);
            }

            if (self.model.isNew()) {
                if (self.fieldName.split('.').length === 1 &&
                    self.formatter && self.formatter.canAutonumber())
                {
                    self.model.set(self.fieldName, self.formatter.value());
                }
                self.validate(true);
            }
            return this;
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
