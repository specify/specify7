define([
    'jquery', 'underscore', 'specifyapi', 'dataobjformatters', 'uiplugin', 'whenall'
], function($, _, api, dataObjFormat, UIPlugin, whenAll) {
    "use strict";

    return UIPlugin.extend({
        render: function() {
            var table = $('<table>').addClass('collectionrelonetomanyplugin');
            this.$el.replaceWith(table);
            this.setElement(table);
            table.append('<tr><th>Collection Object</th><th>Collection</th></tr>');
            $.when(
                this.model.rget('rightsiderels'),
                api.getCollectionObjectRelTypeByName(this.init.relname)
            ).pipe(function(related, reltype) {
                related.queryParams.collectionreltype = reltype.id;

                var getCollection = reltype.rget('leftsidecollection', true).pipe(function(lsCol) {
                    return dataObjFormat(lsCol);
                });

                var getCollectionObjects = related.fetch().pipe(function() {
                    return whenAll(related.map(function(rel) {
                        return rel.rget('leftside', true).pipe(function(co) {
                            return whenAll([
                                co.viewUrl(),
                                dataObjFormat(co)]);
                        });
                    }));
                });

                return $.when(getCollection, getCollectionObjects);
            }).done(function(collection, coInfo) {
                _.each(coInfo, function(info) {
                    var url = info[0], label = info[1];
                    var tr = $('<tr>').appendTo(table);
                    $('<a>', { href: url })
                        .text(label)
                        .appendTo($('<td>').appendTo(tr));
                    $('<a>', { href: url })
                        .text(collection)
                        .appendTo($('<td>').appendTo(tr));
                });
            });
            return this;
        }
    });
});
