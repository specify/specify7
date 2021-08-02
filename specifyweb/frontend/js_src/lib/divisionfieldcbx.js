"use strict";

var $        = require('jquery');
var _        = require('underscore');
var Backbone = require('./backbone.js');

var schema = require('./schema.js');

module.exports =  Backbone.View.extend({
        __name__: "DivisionPicklistCBX",
        events: {
            change: 'set'
        },
        initialize: function(info) {
            this.resource = info.resource;
            this.resource.on('change:fieldname change:tablename change:type', this.render, this);
            const divisionQuery = new schema.models.Division.LazyCollection();
            this.divisionsPromise = new Promise((resolve)=>
                divisionQuery.fetch().then(()=>resolve(divisionQuery.models))
            );
            this.divisions = [];
        },
        getPickListFields: function() {
            return this.divisions;
        },
        render: function() {
            if(typeof this.divisionsPromise === 'object'){
                this.divisionsPromise.then((divisions)=>{
                    this.divisions = divisions.map((division)=>({
                        value: division.get('id'),
                        title: division.get('name')
                    }));
                    this.divisionsPromise = undefined;
                    this.render();
                });
                return this;
            }

            var options = this.getPickListFields().map(function(item) {
                return $('<option>').attr('value', item.value).text(item.title)[0];
            });
            this.$el.empty().append(options).prop('disabled', options.length < 1);
            this.$el.val(this.resource.get('fieldname'));
            this.set();
            return this;
        },
        set: function(event) {
            this.resource.set('fieldname', this.$el.val());
        }
    });

