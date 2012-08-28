define([
    'jquery', 'underscore', 'backbone', 'dataobjformatters', 'cs!fieldformat', 'uiparse',
    'cs!saveblockers', 'cs!tooltipmgr'
], function($, _, Backbone, dataObjFormat, fieldformat, uiparse, saveblockers, ToolTipMgr) {
    "use strict";

    var UIField = Backbone.View.extend({
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

            var fetch = function() {
                return self.model.rget(fieldName).pipe(function(value) {
                    return field.isRelationship ? dataObjFormat(value) :
                        fieldformat(field, value);
                });
            };

            var setControl =_(self.$el.val).bind(self.$el);

            var fillItIn = function() { fetch().done(setControl); };

            fillItIn();
            self.model.onChange(fieldName, fillItIn);
            self.toolTipMgr = new ToolTipMgr(self).enable();
            self.saveblockerEnhancement = new saveblockers.FieldViewEnhancer(self, fieldName);
            return this;
        },
        change: function() {
            var value = this.$el.val().trim();

            var isRequired = this.$el.is('.specify-required-field');
            if (value === '' && isRequired) {
                this.addSaveBlocker('fieldrequired', "Field is required.");
                return;
            } else {
                this.removeSaveBlocker('fieldrequired');
            }

            if (this.$el.is('.specify-formattedtext')) {
                var formatter = this.field.getUIFormatter();
                if (formatter) value = formatter.validate(value);
                if (!value) {
                    this.addSaveBlocker('badformat', "Required format: " + formatter.value());
                    return;
                } else {
                    this.removeSaveBlocker('badformat');
                }
            }

            var parseResult = uiparse(this.field, value);
            if (!parseResult.isValid) {
                this.addSaveBlocker('cantparse', parseResult.reason);
                return;
            } else {
                this.removeSaveBlocker('cantparse');
            }

            this.model.set(this.fieldName, parseResult.parsed);
            if (!this.field.isRelationship)
                this.$el.val(fieldformat(this.field, parseResult.parsed));
        },
        addSaveBlocker: function(key, message) {
            this.model.saveBlockers.add(key + ':' + this.fieldName, this.fieldName, message);
        },
        removeSaveBlocker: function(key) {
            this.model.saveBlockers.remove(key + ':' + this.fieldName);
        }
    });

    return UIField;
});
