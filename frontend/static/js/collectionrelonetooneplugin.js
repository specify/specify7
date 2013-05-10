define([
    'jquery', 'underscore', 'specifyapi', 'dataobjformatters',
    'navigation', 'uiplugin', 'whenall'
], function($, _, api, dataObjFormat, navigation, UIPlugin, whenAll) {
    "use strict";

    return UIPlugin.extend({
        events: {
            'click a': 'go',
            'click button': 'set'
        },
        render: function() {
            var _this = this;
            var control = $('<div><a /><button>Set</button></div>');
            this.$el.replaceWith(control);
            this.setElement(control);
            this.$('button').hide(); // disable this for now.

            $.when(
                this.model.rget('leftsiderels'),
                api.getCollectionObjectRelTypeByName(this.init.relname)
            ).pipe(function(related, reltype) {
                related.queryParams.collectionreltype = reltype.id;

                var getCollection = reltype.rget('rightsidecollection', true).pipe(function(rsCol) {
                    _this.otherCollection = rsCol;
                    return dataObjFormat(rsCol);
                });

                var getCollectionObject = related.fetch({ limit: 1 }).pipe(function() {
                    return (related.length < 1) ? null :
                        related.first().rget('rightside', true).pipe(function(co) {
                            _this.otherCO = co;
                            return dataObjFormat(co);
                        });
                });

                return $.when(getCollection, getCollectionObject);
            }).done(function(collection, coLabel) {
                if (coLabel) {
                    _this.$('a').text(coLabel).attr('href', _this.otherCO.viewUrl());
                } else {
                    _this.$('a').hide();
                }
            });
            return this;
        },
        go: function(evt) {
            evt.preventDefault();
            navigation.switchCollection(this.otherCollection, $(evt.currentTarget).prop('href'));
        },
        set: function(evt) {
            evt.preventDefault();
        }
    });
});
