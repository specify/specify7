"use strict";

var $ = require('jquery');
var _ = require('underscore');

var UIPlugin = require('./uiplugin.js');
var schema   = require('./schema.js');
var QueryCbx = require('./querycbx.js');


    var hostTaxonTypesearch = $.parseXML(
        '<typesearch tableid="4" name="HostTaxon" searchfield="fullName" displaycols="fullName" format="%s" dataobjformatter="Taxon"/>'
    );

module.exports =  UIPlugin.extend({
        __name__: "HostTaxonPlugin",
        render: function() {
            var input = $('<input type="text" name="hosttaxon">');
            this.$el.replaceWith(input);
            this.setElement(input);

            var collection = new schema.models.CollectionRelType.LazyCollection({
                filters: { name: this.init.relname }
            });
            collection.fetch({limit: 1})
                .pipe(function() { return collection.first(); })
                .pipe(function(relType) {
                    return relType.rget('rightsidecollection');
                }).done(this.setupQCbx.bind(this));
            return this;
        },
        setupQCbx: function(rightsideCollection) {
            new QueryCbx({
                populateForm: this.populateForm,
                el: this.el,
                model: this.model,
                relatedModel: schema.Taxon, // Todo: this shouldn't work.
                forceCollection: rightsideCollection,
                hideButtons: true,
                init: {},
                typesearch: $('typesearch', hostTaxonTypesearch)
            }).render();
        }
    }, { pluginsProvided: ['HostTaxonPlugin'] });

