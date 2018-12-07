"use strict";

const $         = require('jquery');
const _         = require('underscore');
const Backbone  = require('./backbone.js');

const singularTemplate = require('./templates/othercollectiontemplate.html');
const pluralTemplate = require('./templates/othercollectionstemplate.html');
const navigation =  require('./navigation.js');
const userInfo = require('./userinfo.js');


module.exports =  Backbone.View.extend({
        __name__: "OtherCollectionView",
        events: {
            'click a': 'clicked'
        },
    initialize: function({resource, collections}) {
        const availableCollections = userInfo.available_collections.map(c => c[0]);

        this.resource = resource;
        this.collections = collections.filter(c => availableCollections.includes(c.id));
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
            } else if (this.collections.length == 1) {
                this.$el.html(singularTemplate());
                this.$('a').data('collection-id', this.collections[0].id).button();
                this.$('span.collection-name').text(this.collections[0].get('collectionname'));
            } else {
                this.$el.text("You do not have access to any collection containing this resource " +
                              "through the currently logged in account.");
            }
            return this;
        },
        clicked: function(evt) {
            evt.preventDefault();
            navigation.switchCollection($(evt.currentTarget).data('collection-id'));
        }
    });

