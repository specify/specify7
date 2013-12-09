define(['jquery', 'underscore', 'backbone'], function($, _, Backbone) {
    "use strict";
    return Backbone.View.extend({
        __name__: "TreeLevelPickListView",
        events: {
            change: 'changed'
        },
        initialize: function(options) {
            this.model.on('change:parent', this.render, this);
            this.lastFetch = null;
            this.field = this.model.specifyModel.getField(this.$el.attr('name'));
        },
        render: function() {
            this.$el.empty();
            var fetch = this.lastFetch = this.model.rget('parent.definitionitem', true).pipe(function(parentTreeDefItem) {
                if (!parentTreeDefItem) return _([]);
                var children = new parentTreeDefItem.specifyModel.LazyCollection({
                    filters: {rankid__gt: parentTreeDefItem.get('rankid')}
                });
                return children.fetch({limit: 0}).pipe(function() {return children;});
            });

            var _this = this;
            fetch.done(function(children) {
                if (fetch === _this.lastFetch) {
                    var fieldName = _this.$el.attr('name');
                    var value = _this.model.get(fieldName);
                    children.each(function(child) {
                        var url = child.url();
                        _this.$el.append($('<option>', {
                            value: url,
                            selected: url === value
                        }).text(child.get('name')));
                    });

                    // # make sure value in the resouce is consitent with what is displayed.
                    if (!value || _this.$el.find('option[value="' + value + '"]').length < 1) {
                        _this.model.set(fieldName, children.first());
                    }
                }
            });
            return this;
        },
        changed: function() {
            var selected = this.field.getRelatedModel().Resource.fromUri(this.$el.val());
            this.model.set(this.$el.attr('name'), selected);
        }
    });
});
