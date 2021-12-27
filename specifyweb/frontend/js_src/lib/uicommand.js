"use strict";

import Backbone from './backbone';

import specifyform from './specifyform';

export default Backbone.View.extend({
        __name__: "UICommand",
        initialize: function() {
            this.init = specifyform.parseSpecifyProperties(this.$el.data('specify-initialize'));
        }
    });
