"use strict";

import Backbone from './backbone';
import {parseSpecifyProperties} from './parsespecifyproperties';

export default Backbone.View.extend({
        __name__: "UICommand",
        initialize: function() {
            this.init = parseSpecifyProperties(this.$el.data('specify-initialize'));
        }
    });
