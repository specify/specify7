"use strict";

const $ = require('jquery');
const Q = require('q');
const Backbone = require('./backbone.js');

const UIPlugin = require('./uiplugin.js');
const schema = require('./schema.js');
const adminText = require('./localization/admin').default;
const commonText = require('./localization/common').default;

const SetCollectionsView = Backbone.View.extend({
    __name__: "UserCollectionsUI",
    initialize({user, collections, allCollections}) {
        this.user = user;
        this.collections = collections;
        this.allCollections = allCollections;
    },
    render() {
        $(`<span>
          ${this.allCollections.map(collection=>`<label>
            <input
              type="checkbox"
              value="${collection.id}"
              ${this.collections.includes(collection.id) ? 'checked': ''}
            >
            ${collection.get('collectionname')}
          </label>`).join('<br>')}
        </span>`).appendTo(this.$el);
        const save = () => {
            this.collections = Object.values(
              this.el.querySelectorAll('input:checked')
            ).map(input=>
              parseInt(input.value)
            );
            return Q($.ajax(`/context/user_collection_access/${this.user.id}/`, {
                method: 'PUT',
                data: JSON.stringify(this.collections),
                processData: false
            }));
        };

        this.$el.dialog({
            modal: true,
            title: adminText('userCollectionsPluginDialogTitle'),
            close: function() { $(this).remove(); },
            buttons: {
                [commonText('save')]: function() { save().done(() => $(this).dialog('close')); },
                [commonText('cancel')]: function() { $(this).dialog('close'); }
            }
        });
        return this;
    }
});


module.exports =  UIPlugin.extend({
    __name__: "UserCollectionsPlugin",
    events: {
        'click': 'clicked'
    },
    initialize: function(options) {
        this.user = options.model;
        this.allCollections = new schema.models.Collection.LazyCollection();
    },
    render: function() {
        Q.all([this.user.fetch(), this.allCollections.fetch({limit:0})]).then(() => {
            this.$el.attr('value', adminText('collections'));
            this.user.isNew() && this.$el.attr('title', adminText('userCollectionsPluginButtonDisabledDescription')).prop('disabled', true);
        });
        return this;
    },
    clicked: function(event) {
        $.get(`/context/user_collection_access/${this.user.id}/`).done(permitted => {
            new SetCollectionsView({
                user: this.user,
                collections: permitted,
                allCollections: this.allCollections
            }).render();
        });
    }
}, { pluginsProvided: ['UserCollectionsUI'] });

