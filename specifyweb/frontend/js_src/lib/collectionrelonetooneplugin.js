"use strict";

import $ from 'jquery';

import dataobjformatters from './dataobjformatters';
import OneToMany from './collectionrelonetomanyplugin';

var format = dataobjformatters.format;

import formsText from './localization/forms';

export default OneToMany.extend({
    __name__: "CollectionRelOneToOnePlugin",
    render: function() {
        var control = $(`<div>
            <a />
            <button>${formsText('set')}</button>
        </div>`);
        this.$el.replaceWith(control);
        this.setElement(control);
        this.$('button').hide(); // disable this for now.
        this.model.isNew() || this.fillIn();
        return this;
    },
    gotRelatedObjects: function(collectionObjects) {
        var a = this.$('a');
        if (collectionObjects.length > 0) {
            var co = collectionObjects[0];
            a.attr('href', co.viewUrl());
            format(co).done(function(text) { a.text(text); });
        } else {
            a.hide();
        }
    }
}, { pluginsProvided: ['ColRelTypePlugin'] });

