define([
    'jquery', 'underscore', 'uiplugin', 'specifyapi', 'schema', 'querycbx'
], function($, _, UIPlugin, api, schema, QueryCbx) {
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

            api.getCollectionObjectRelTypeByName(this.init.relname).pipe(function(relType) {
                return relType.rget('rightsidecollection');
            }).done(this.setupQCbx.bind(this));
            return this;
        },
        setupQCbx: function(rightsideCollection) {
            new QueryCbx({
                el: this.el,
                model: this.model,
                relatedModel: schema.Taxon,
                forceCollection: rightsideCollection,
                init: {},
                typesearch: $('typesearch', hostTaxonTypesearch)
            }).render();
        }
    });
});
