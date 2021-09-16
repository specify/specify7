"use strict";

const $         = require('jquery');
const _         = require('underscore');
const Backbone  = require('./backbone.js');

const navigation =  require('./navigation.js');
const userInfo = require('./userinfo.js');
const commonText = require('./localization/common').default;


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
                this.$el.html(`
                    <p>${commonText('resourceInaccessible')}</p>
                    <p>${commonText('selectCollection')}</p>
                    <ul>
                        <li><a>Collection</a></li>
                    </ul>
                `);
                var ul = this.$('ul');
                var li = ul.find('li').detach();
                _.each(this.collections, function(collection) {
                    li.clone().appendTo(ul).find('a')
                        .text(collection.get('collectionname'))
                        .data('collection-id', collection.id)
                        .button();
                }, this);
            } else if (this.collections.length == 1) {
                this.$el.html(`
                    <p>${commonText('resourceInaccessible')}</p>
                    <p>${commonText('loginToProceed')(this.collections[0].get('collectionname'))}
                      <a>${commonText('open')}</a>
                    </p>
                `);
                this.$('a').data('collection-id', this.collections[0].id).button();
            } else {
                this.$el.text(commonText('noAccessToResource'));
            }
            return this;
        },
        clicked: function(evt) {
            evt.preventDefault();
            navigation.switchCollection($(evt.currentTarget).data('collection-id'));
        }
    });

