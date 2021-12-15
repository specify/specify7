"use strict";

import $ from 'jquery';
import Backbone from './backbone.js';

import schema from './schema.js';

export default Backbone.View.extend({
        __name__: "DivisionPicklistCBX",
        events: {
            change: 'set'
        },
        initialize: function(info) {
            this.resource = info.resource;
            this.resource.on('change:fieldname change:tablename change:type', this.render, this);
            const divisionQuery = new schema.models.Division.LazyCollection();
            this.picklistItemsPromise = new Promise((resolve)=>
                divisionQuery.fetch({limit:0}).done(()=>resolve(divisionQuery.models))
            ).then((divisions) => divisions.map((division)=>({
                value: division.get('resource_uri'),
                title: division.get('name')
            })));
        },
        render: function() {
            this.picklistItemsPromise.then(items => {
                const options = items.map(item => $('<option>').attr('value', item.value).text(item.title));
                this.$el.empty().append(options).prop('disabled', options.length < 1);
                this.$el.val(this.resource.get('division'));
                this.set();
            });
            return this;
        },
        set: function(event) {
            this.resource.set('division', this.$el.val());
        }
    });

