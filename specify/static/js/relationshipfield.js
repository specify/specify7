define([
    'jquery', 'underscore', 'uifield', 'dataobjformatters'
], function($, _, UIField, dataObjFormat) {
    "use strict";

    return UIField.extend({
        render: function() {
            var self = this;
            var fieldName = self.fieldName;
            var field = self.field;
            if (!field) return self;

            self.$el.removeClass('specify-field').addClass('specify-object-formatted');
            self.$el.prop('readonly', true);

            var setControl = _.bind(self.setValue, self);

            var fillItIn =  function() {
                self.fetch().pipe(dataObjFormat).done(setControl);
            };

            fillItIn();
            self.model.onChange(fieldName, fillItIn);
            return this;
        }
    });
});