"use strict";

import Backbone from './backbone';

import specifyform from './specifyform';

export default Backbone.View.extend({
        __name__: 'SpinnerFieldUI',
        events: {
            'spinstop': 'change',
            'change': 'change'
        },
        render: function() {
            var fieldName = this.$el.attr('name');
            var init = specifyform.parseSpecifyProperties(this.$el.data('specify-initialize'));

            this.$el.prop('readonly') || this.$el.spinner({
                    min: init['min'] || 0,
                    max: init['max'] || null
            });

            var self = this;
            this.model.on('change:' + fieldName.toLowerCase(), this.fillIn, this);
            self.fillIn();

            return this;
        },
        fillIn: function() {
            var fieldName = this.$el.attr('name');
            var val =  this.model.get(fieldName);

            if (this.$el.prop('readonly')) {
                this.$el.val(val);
            } else {
                //this.$el.spinner('value', val); });
                this.$el.val(val);
            }
        },
        change: function() {
            //var val = this.$el.spinner('value');
            var val = this.$el.val();
            val = val && parseInt(val, 10);
            this.model.set(this.$el.attr('name'), val);
        }
    });

