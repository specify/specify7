"use strict";

var $ = require('jquery');
var _ = require('underscore');

var dataobjformatters = require('./dataobjformatters.js');
var OneToMany         = require('./collectionrelonetomanyplugin.js');

    var format = dataobjformatters.format;

module.exports =  OneToMany.extend({
        __name__: "CollectionRelOneToOnePlugin",
        render: function() {
            var control = $('<div><a /><button>Set</button></div>');
            this.$el.replaceWith(control);
            this.setElement(control);
            this.$('button').hide(); // disable this for now.
            this.fillIn();
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
    }, { pluginsProvided: ['CollectionRelTypePlugin'] });

