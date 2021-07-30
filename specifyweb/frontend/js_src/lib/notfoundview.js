"use strict";

import Backbone from './backbone';
import commonText from './localization/common';

export default Backbone.View.extend({
        __name__: "NotFoundView",
        render: function() {
            var self = this;
            self.$el.empty();
            self.$el.append(`<h3>${commonText('pageNotFound')}</h3`);
        }
    });

