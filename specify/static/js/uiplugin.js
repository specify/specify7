define(['backbone', 'specifyform'], function(Backbone, specifyform) {
    "use strict";

    return Backbone.View.extend({
        initialize: function(options) {
            this.init = specifyform.parseSpecifyProperties(this.$el.data('specify-initialize'));
        }
    });
});