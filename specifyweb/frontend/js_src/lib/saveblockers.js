"use strict";

var $ = require('jquery');
var _ = require('underscore');

    //TODO: only propagate for dependent resources

    function triggerOnParent(resource) {
        return resource.parent ? resource.parent.trigger.bind(resource.parent) :
            function () {};
    }

    function triggerOnCollectionRelated(resource) {
        return (resource.collection && resource.collection.related &&
                resource.collection.related.trigger.bind(resource.collection.related)) ||
            function () {};
    }

    function SaveBlockers(resource) {
        this.resource = resource;
        this.blockers = {};
        this.resource.on('saveblocked', function(blocker) {
            triggerOnParent(resource)('saveblocked', blocker);
            triggerOnCollectionRelated(resource)('saveblocked', blocker);
        });
        this.resource.on('oktosave destory', function(source) {
            triggerOnParent(resource)('oktosave', source);
            triggerOnCollectionRelated(resource)('oktosave', source);
        });
        this.resource.on('remove', function(source) {
            triggerOnCollectionRelated(resource)('oktosave', source);
        });
    }

    _.extend(SaveBlockers.prototype, {
        add: function(key, field, reason, deferred) {
            if (deferred == null) deferred = false;
            field = field != null ? field.toLowerCase() : void 0;
            var blocker = this.blockers[key] = {
                resource: this.resource,
                field: field,
                reason: reason,
                deferred: deferred
            };
            this.triggerSaveBlocked(blocker);
        },
        triggerSaveBlocked: function(blocker) {
            this.resource.trigger('saveblocked', blocker);
            blocker.field && this.resource.trigger("saveblocked:" + blocker.field, blocker);
        },
        remove: function(key) {
            var blocker = this.blockers[key];
            if (!blocker) return;

            var field = blocker.field;
            delete this.blockers[key];
            if (field && _.isEmpty(this.blockersForField(field))) {
                this.resource.trigger("nosaveblockers:" + field);
            }
            if (_.isEmpty(this.blockers)) {
                this.resource.trigger('oktosave', this.resource);
            }
        },
        getAll: function() {
            return this.blockers;
        },
        blockersForField: function(field) {
            return _.filter(this.blockers, function(blocker) { return blocker.field === field; });
        },
        fireDeferredBlockers: function() {
            _.each(this.blockers, function(blocker) {
                if (blocker.deferred) {
                    blocker.deferred = false;
                    this.triggerSaveBlocked(blocker);
                }
            }, this);
        },
        hasBlockers: function() {
            return !_.empty(this.blockers);
        },
        hasOnlyDeferredBlockers:  function() {
            return _.all(this.blockers, function(blocker) { return blocker.deferred; });
        }
    });

    function FieldViewEnhancer(view, fieldName, control) {
        this.view = view;
        this.field = fieldName.toLowerCase();
        this.control = control || this.view.$el;
        this.view.model.on("saveblocked:" + this.field, this.indicatorOn, this);
        this.view.model.on("nosaveblockers:" + this.field, this.indicatorOff, this);
        this.view.on('requestfortooltips', this.sendToolTips, this);

        this.view.model.saveBlockers &&
            _.each(this.view.model.saveBlockers.blockersForField(this.field),
                   this.indicatorOn, this);
    }

    _.extend(FieldViewEnhancer.prototype, {
        indicatorOn: function(blocker) {
            blocker.deferred || this.control.addClass('saveblocked');
        },
        indicatorOff: function() {
            this.control.removeClass('saveblocked');
        },
        sendToolTips: function() {
            var view = this.view;

            if (!view || !view.model.saveBlockers) return;
            _.each(view.model.saveBlockers.blockersForField(this.field), function(blocker) {
                view.trigger('tooltipitem', blocker.reason);
            });
        }
    });

module.exports = {
        SaveBlockers: SaveBlockers,
        FieldViewEnhancer: FieldViewEnhancer
    };
