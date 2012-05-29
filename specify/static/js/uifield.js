define([
    'jquery', 'underscore', 'backbone', 'dataobjformatters', 'uiformat', 'uivalidate'
], function($, _, Backbone, dataObjFormat, uiformat, uivalidate) {
    "use strict";

    return Backbone.View.extend({
        events: {
            'change': 'change'
        },
        render: function() {
            var self = this;
            var fieldName = self.$el.attr('name');
            var field = self.model.specifyModel.getField(fieldName);
            if (!field) return self;

            self.defaultBGColor = self.$el.css('background-color');

            if (field.isRelationship) {
                self.$el.removeClass('specify-field').addClass('specify-object-formatted');
                self.$el.prop('readonly', true);
            }

            var fetch =  field.isRelationship ? function() {
                return self.model.rget(fieldName).pipe(dataObjFormat);
            } : function () {
                return uiformat(self.model, fieldName);
            };

            var setControl = self.$el.is(':checkbox') ?
                _(self.$el.prop).bind(self.$el, 'checked') : _(self.$el.val).bind(self.$el);

            var fillItIn = function() { fetch().done(setControl); };

            fillItIn();
            self.model.onChange(fieldName, fillItIn);

            return this;
        },
        change: function() {
            var self = this;
            var value = self.$el.is(':checkbox') ? self.$el.prop('checked') : self.$el.val();
            var validation = uivalidate(self.model, self.$el.attr('name'), value);
            if (validation) {
                self.model.set(self.$el.attr('name'), value);
                self.$el.css('background-color', self.defaultBGColor);
            }
            else
                self.$el.css('background-color', 'red');
        }
    });
});