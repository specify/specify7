"use strict";

import $ from 'jquery';

import UIPlugin from './uiplugin';
import schema from './schema';
import QueryCbx from './querycbx';


    var hostTaxonTypesearch = $.parseXML(
        '<typesearch tableid="4" name="HostTaxon" searchfield="fullName" displaycols="fullName" format="%s" dataobjformatter="Taxon"/>'
    );

export default UIPlugin.extend({
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

