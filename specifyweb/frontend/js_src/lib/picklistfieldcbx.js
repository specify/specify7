"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import schema from './schema';

export default Backbone.View.extend({
        __name__: "PickListFieldCBX",
        events: {
            change: 'set'
        },
        initialize: function(info) {
            this.resource = info.resource;
            this.resource.on('change:fieldname change:tablename change:type', this.render, this);
        },
        getPickListFields: function() {
            if (this.resource.get('type') !== 2) return [];
            var model = schema.getModel(this.resource.get('tablename'));
            return _.map(model.getAllFields(), function(field) {
                return { value: field.name, title: field.getLocalizedName() };
            });
        },
        render: function() {
            var options = this.getPickListFields().map(function(item) {
                return $('<option>').attr('value', item.value).text(item.title)[0];
            });
            this.$el.empty().append(options).prop('disabled', options.length < 1);
            this.$el.val(this.resource.get('fieldname'));
            this.set();
            return this;
        },
        set: function() {
            this.resource.set('fieldname', this.$el.val());
        }
    });

