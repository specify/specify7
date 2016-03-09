"use strict";

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');

var singularTemplate = require('./templates/othercollectiontemplate.html');
var pluralTemplate = require('./templates/othercollectionstemplate.html');
var navigation =  require('./navigation.js');


module.exports =  Backbone.View.extend({
        __name__: "OtherCollectionView",
        events: {
            'click a': 'clicked'
        },
        initialize: function(options) {
            this.resource = options.resource;
            this.collections = options.collections;
        },
        render: function() {
            this.$el.empty();
            if (this.collections.length > 1) {
                this.$el.html(pluralTemplate());
                var ul = this.$('ul');
                var li = ul.find('li').detach();
                _.each(this.collections, function(collection) {
                    li.clone().appendTo(ul).find('a')
                        .text(collection.get('collectionname'))
                        .data('collection-id', collection.id)
                        .button();
                }, this);
            } else {
                this.$el.html(singularTemplate());
                this.$('a').data('collection-id', this.collections[0].id).button();
                this.$('span.collection-name').text(this.collections[0].get('collectionname'));
            }
            return this;
        },
        clicked: function(evt) {
            evt.preventDefault();
            navigation.switchCollection($(evt.currentTarget).data('collection-id'));
        }
    });

