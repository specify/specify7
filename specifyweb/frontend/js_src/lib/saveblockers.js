"use strict";

import _ from 'underscore';
import {validationMessages} from './validationmessages';

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
        this.inputs = {};
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
        add: function(key, fieldName, reason, deferred) {
            if (deferred == null) deferred = false;
            fieldName = fieldName != null ? fieldName.toLowerCase() : void 0;
            var blocker = this.blockers[key] = {
                resource: this.resource,
                fieldName: fieldName,
                reason: reason,
                deferred: deferred
            };
            this.triggerSaveBlocked(blocker);
            this.refreshValidation(blocker);
        },
        triggerSaveBlocked: function(blocker) {
            this.resource.trigger('saveblocked', blocker);
            blocker.fieldName && this.resource.trigger("saveblocked:" + blocker.fieldName, blocker);
        },
        remove: function(key) {
            var blocker = this.blockers[key];
            if (!blocker) return;

            var fieldName = blocker.fieldName;
            delete this.blockers[key];
            if (fieldName && _.isEmpty(this.blockersForField(fieldName))) {
                this.resource.trigger("nosaveblockers:" + fieldName);
            }
            if (_.isEmpty(this.blockers)) {
                this.resource.trigger('oktosave', this.resource);
            }
            
            this.refreshValidation(blocker);
        },
        linkInput(input, fieldName){
            this.inputs[fieldName] ??= [];
            const update = this.handleFocus.bind(this, input, fieldName);
            input.addEventListener('focus', update);
            this.inputs[fieldName].push({
                el: input,
                destructor: () => input.removeEventListener('focus', update),
            });
            update();
        },
        handleFocus(input, fieldName){
            validationMessages(input, Object.values(this.blockers).filter(blocker =>
                blocker.fieldName === fieldName,
            ).map(blocker => blocker.reason));
        },
        unlinkInput(targetInput){
            this.inputs = Object.fromEntries(
                Object.entries(this.inputs).filter(([_fieldName, inputs]) =>
                    inputs.filter((input) => {
                        if(input.el === targetInput){
                            input.destructor();
                            return true;
                        }
                        return false;
                    })
                )
            );
        },
        refreshValidation(blocker){
            (
                this.inputs[blocker.fieldName] ?? []
            ).forEach(input =>
                validationMessages(input.el, this.blockersForField(
                    blocker.fieldName,
                ).map(blocker => blocker.reason) ?? []),
            );
        },
        getAll: function() {
            return this.blockers;
        },
        blockersForField(fieldName) {
            return Object.values(this.blockers)
                .filter(blocker=>blocker.fieldName===fieldName)
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


export default {
    SaveBlockers,
    FieldViewEnhancer;
};
