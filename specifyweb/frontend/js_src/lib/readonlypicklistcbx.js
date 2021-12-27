"use strict";

import $ from 'jquery';
import _ from 'underscore';
import queryText from './localization/query';

import Base from './basepicklist';

export default Base.extend({
        __name__: "ReadOnlyPickListView",
        events: {
            change: 'setValueIntoModel'
        },
        setValueIntoModel: function() {
            var info = this.info;
            var value = this.$el.val() || null;
            if (info.field.type === 'java.lang.Byte') {
                value == null || (value = parseInt(value, 10));
            }
            this.model.set(info.field.name, value);
        },
        _render: function(info) {
            var items = info.pickListItems;
            var value = info.resource.get(info.field.name);

            // value maybe undefined, null, a string, a number, or a Backbone model
            // if the latter, we use the URL of the object to represent it
            if (value != null && value.url) {
                value = value.url();
            }

            const nullValueInPL = items.some(item => item.value == null);

            if (!this.el.required && !nullValueInPL) {
                // need an option for no selection
                this.$el.append('<option>');
            }

            var options = items.map(
                item => $('<option>', {value: item.value == null ? '' : item.value.toString()})
                    .text(item.title)
            );

            this.$el.append(options);

            // value will be undefined when creating picklist for new resource
            // so we set the model to have whatever the select element is set to
            if (_.isUndefined(value)) {
                this.setValueIntoModel();
                return;
            }

            // value is now either null or a string, or a number
            // make it a string
            value = (value == null ? '' : value.toString());

            if (value && options.every(option => option.attr('value') !== value)) {
                // current value is not in picklist
                this.$el.append($('<option>', { value: value }).text(queryText('invalidPicklistValue')(value)));
            }

            if (value === '' && this.el.required) {
                // value is required but missing from database
                this.$el.append(`<option>
                    ${queryText('missingRequiredPicklistValue')}
                </option>`);
            }

            this.$el.val(value);

            // run business rules to make sure current value is acceptable
            this.model.businessRuleMgr.checkField(info.field.name);
        },
        resetValue: function() {
            var info = this.info;
            this.$el.val(info.resource.get(info.field.name));
        }
    });

