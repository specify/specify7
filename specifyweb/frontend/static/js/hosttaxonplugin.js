define([
    'jquery', 'underscore', 'uiplugin', 'schema', 'querycbx'
], function($, _, UIPlugin, schema, QueryCbx) {
    "use strict";

    var hostTaxonTypesearch = $.parseXML(
        '<typesearch tableid="4" name="HostTaxon" searchfield="fullName" displaycols="fullName" format="%s" dataobjformatter="Taxon"/>'
    );

    return UIPlugin.extend({
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
});
