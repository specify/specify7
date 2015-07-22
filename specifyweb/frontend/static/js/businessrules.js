define([
    'jquery', 'underscore', 'schema', 'specifyapi', 'whenall', 'saveblockers',
    'treebusinessrules', 'businessruledefs'
], function($, _, schema, api, whenAll, saveblockers, treeBusinessRules, rules) {
    "use strict";
    var enabled = true;

    var protect = _(schema.models).reduce(function(acc, m) {
        return acc.concat(m.getAllFields().filter(function(f) {
            var reverse = f.isRelationship && f.getReverse();
            return f.type == 'many-to-one' && !(reverse && reverse.dependent);
        }));
    }, []);

    var deleteBlockers = _.reduce(protect, function(acc, f) {
        var related = f.getRelatedModel();
        if (related) {
            acc[related.name] == null && (acc[related.name] = []);
            acc[related.name].push(f);
        }
        return acc;
    }, {});


    api.on('initresource', function(resource) {
        if (enabled && !resource.noBusinessRules) attachTo(resource);
    });

    var attachTo = function(resource) {
        var mgr;
        mgr = resource.businessRuleMgr = new BusinessRuleMgr(resource);
        mgr.setupEvents();
        resource.saveBlockers = new saveblockers.SaveBlockers(resource);
        mgr.doCustomInit();
    };

    function BusinessRuleMgr(resource) {
        this.resource = resource;
        this.rules = rules[this.resource.specifyModel.name];
        this.protectedRelationships = _.object(
            (deleteBlockers[this.resource.specifyModel.name] || []).map(function(rel) {
                return [rel.dottedName, rel];
            }));
        this.fieldChangeDeferreds = {};
        this.watchers = {};
        this.deleteBlockers = {};
        _.each(this.protectedRelationships, function(rel, fieldname) {
            this.deleteBlockers[fieldname] = true;
        }, this);
        this.isTreeNode = treeBusinessRules.isTreeNode(this.resource);
    }

    _(BusinessRuleMgr.prototype).extend({

        setupEvents: function() {
            this.resource.on('change', this.changed, this);
            this.resource.on('add', this.added, this);
            this.resource.on('remove', this.removed, this);
            // this.rules && _.each(this.resource.specifyModel.getAllFields(), function(field) {
            //     var fieldname = field.name.toLowerCase();
            //     if (field.type === 'one-to-many' && _(this.rules.deleteBlockers).contains(fieldname)) {
            //         this.resource.on("add:" + fieldname, function() {
            //             this.addDeleteBlocker(fieldname);
            //         }, this);
            //         // # possible race condition if getRelatedObject count goes through before
            //         // # the deletion associated following remove event occurs
            //         // # a work around might be to always do destroy({ wait: true })
            //         this.resource.on("remove:" + fieldname, function() {
            //             this.tryToRemDeleteBlocker(fieldname);
            //         }, this);
            //     }
            // }, this);
        },

        doCustomInit: function() {
            this.rules && this.rules.customInit && this.rules.customInit(this.resource);
        },

        checkCanDelete: function() {
            if (this.canDelete()) {
                this.resource.trigger('candelete');
                return $.when(true);
            } else {
                return whenAll(_.map(this.deleteBlockers, function(__, fieldname) {
                    return this.tryToRemDeleteBlocker(fieldname);
                }, this));
            }
        },

        canDelete: function() {
            return _.isEmpty(this.deleteBlockers);
        },

        addDeleteBlocker: function(fieldname) {
            this.deleteBlockers[fieldname] = true;
            this.resource.trigger('deleteblocked');
        },

        tryToRemDeleteBlocker: function(fieldname) {
            var _this = this;
            var rel = this.protectedRelationships[fieldname];
            var collection = new rel.model.ToOneCollection({
                related: this.resource,
                field: rel
            });
            return collection.getTotalCount().done(function(count) {
                if (count < 1) {
                    _this.resource.trigger('removingdeleteblocker', fieldname);
                    delete _this.deleteBlockers[fieldname];
                    if (_this.canDelete()) _this.resource.trigger('candelete');
                }
            });
        },

        getDeleteBlockers: function() {
            return _(this.deleteBlockers).map(function(__, fieldname) {
                return this.protectedRelationships[fieldname];
            }, this);
        },

        changed: function(resource) {
            if (!resource._fetch && !resource._save) {
                _.each(resource.changed, function(__, fieldName) {
                    this.checkField(fieldName);
                }, this);
            }
        },

        added: function(resource, collection) {
            if (resource.specifyModel && resource.specifyModel.getField('ordinal')) {
                resource.set('ordinal', collection.indexOf(resource));
            }
            this.rules && this.rules.onAdded && this.rules.onAdded(resource, collection);
        },

        removed: function(resource, collection) {
            this.rules && this.rules.onRemoved && this.rules.onRemoved(resource, collection);
        },

        checkField: function(fieldName) {
            var _this = this;
            fieldName = fieldName.toLowerCase();

            var deferred = this.fieldChangeDeferreds[fieldName] = whenAll([
                this.doCustomCheck(fieldName),
                this.checkUnique(fieldName),
                this.isTreeNode ? treeBusinessRules.run(this.resource, fieldName) : null]);

            deferred.done(function(results) {
                if (deferred === _this.fieldChangeDeferreds[fieldName]) {
                    delete _this.fieldChangeDeferreds[fieldName];
                    _.each(_.compact(results), function(result) {
                        if (!result.valid) {
                            _this.resource.saveBlockers.add(result.key, fieldName, result.reason);
                        } else {
                            _this.resource.saveBlockers.remove(result.key);
                        }
                        result.action && result.action();
                    });
                }
            });
        },

        doCustomCheck: function(fieldName) {
            return this.rules
                && this.rules.customChecks
                && this.rules.customChecks[fieldName]
                && this.rules.customChecks[fieldName](this.resource);
        },

        checkUnique: function(fieldName) {
            var _this = this;
            var results;
            if (this.rules && this.rules.unique && _(this.rules.unique).contains(fieldName)) {
                results = [uniqueIn(null, this.resource, fieldName)];
            } else {
                var toOneFields = (this.rules && this.rules.uniqueIn && this.rules.uniqueIn[fieldName]) || [];
                if (!_.isArray(toOneFields)) toOneFields = [toOneFields];
                results = _.map(toOneFields, function(def) {
                    var field = def;
                    var fieldNames = [fieldName];
                    if (typeof def != 'string') {
                        fieldNames = fieldNames.concat(def.otherfields);
                        field = def.field;
                    }
                    return uniqueIn(field, _this.resource, fieldNames); });
            };
            whenAll(results).done(function(results) {
                _.chain(results).pluck('localDupes').compact().flatten().each(function(dup) {
                    var event = dup.cid + ':' + fieldName;
                    if (_this.watchers[event]) return;
                    _this.watchers[event] = dup.on('change remove', function() {
                        _this.checkField(fieldName);
                    });
                });
            });
            return combineUniquenessResults(results).pipe(function(result) {
                result.key = 'br-uniqueness-' + fieldName;
                return result;
            });
        }
    });


    var combineUniquenessResults = function(deferredResults) {
        return whenAll(deferredResults).pipe(function(results) {
            var invalids = _.filter(results, function(result) {
                return !result.valid;
            });
            return (invalids.length < 1) ? {valid: true} : {valid: false, reason: _(invalids).pluck('reason').join(', ')};
        });
    };

    var getUniqueInInvalidReason = function(parentFldInfo, fldInfo) {
        var result = 'Value must be unique to ';
        if (fldInfo.length > 1) {
            var fldNames = _.reduce(fldInfo, function(result, fld, idx) {
                if (idx > 0) {
                    result = result +  (idx < fldInfo.length-1 ? ', ' : ' and ');
                }
                return result + fld.getLocalizedName();
            }, '');
            result = 'Values of ' + fldNames + ' must be unique to ';
        }
        return result + (parentFldInfo ? parentFldInfo.getLocalizedName() : 'database');
    };

    var uniqueIn = function(toOneField, resource, valueFieldArg) {
        var valueField = $.isArray(valueFieldArg) ? valueFieldArg : [valueFieldArg];
        var value = _.map(valueField, function(v) { return resource.get(v);});
        var valueFieldInfo = _.map(valueField, function(v) { return resource.specifyModel.getField(v); });
        var valueIsToOne = _.map(valueFieldInfo, function(fi) { return fi.type === 'many-to-one'; });
        var valueId = _.map(value, function(v, idx) {
            if (valueIsToOne[idx]) {
                if (_.isNull(v) || typeof v == 'undefined')  {
                    return null;
                } else {
                    return _.isString(v) ? valueFieldInfo[idx].getRelatedModel().Resource.fromUri(v).id : v.id;
                }
            } else {
                return undefined;
            }
        });

        var toOneFieldInfo = toOneField ? resource.specifyModel.getField(toOneField) : undefined;
        var valid = {
            valid: true
        };
        var invalid = {
            valid: false,
            reason: getUniqueInInvalidReason(toOneFieldInfo, valueFieldInfo)
        };

        var allNullOrUndefinedToOnes = _.reduce(valueId, function(result, v, idx) {
            return result &&
                valueIsToOne[idx] ? _.isNull(valueId[idx]) : false;
        }, true);
        if (allNullOrUndefinedToOnes) {
            return $.when(valid);
        }

        var hasSameVal = function(other, value, valueField, valueIsToOne, valueId) {
            if ((other.id != null) && other.id === resource.id) return false;
            if (other.cid === resource.cid) return false;
            var otherVal = other.get(valueField);
            if (valueIsToOne && typeof otherVal != 'undefined' && !(_.isString(otherVal))) {
                return parseInt(otherVal.id, 10) === parseInt(valueId, 10);
            } else {
                return value === otherVal;
            }
        };

        var hasSameValues = function(other, values, valueFields, valuesAreToOne, valueIds) {
            return _.reduce(values, function(result, val, idx) {
                return result && hasSameVal(other, val, valueFields[idx], valuesAreToOne[idx], valueIds[idx]);
            }, true);
        };

        if (toOneField != null) {
            var haveLocalColl = (resource.collection && resource.collection.related &&
                                 toOneFieldInfo.getRelatedModel() === resource.collection.related.specifyModel);

            var localCollection = haveLocalColl ? _.compact(resource.collection.models) : [];
            var dupes = _.filter(localCollection, function(other) { return hasSameValues(other, value, valueField, valueIsToOne, valueId); });
            if (dupes.length > 0) {
                invalid.localDupes = dupes;
                return $.when(invalid);
            }
            return resource.rget(toOneField).pipe(function(related) {
                if (!related) return valid;
                var filters = {};
                for (var f = 0; f < valueField.length; f++) {
                    filters[valueField[f]] = valueId[f] || value[f];
                }
                var others = new resource.specifyModel.ToOneCollection({
                    related: related,
                    field: toOneFieldInfo,
                    filters: filters
                });
                return others.fetch().pipe(function() {
                    var inDatabase = others.chain().compact();
                    inDatabase = haveLocalColl ? inDatabase.filter(function(other) {
                        return !(resource.collection.get(other.id));
                    }).value() : inDatabase.value();
                    if (_.any(inDatabase, function(other) { return hasSameValues(other, value, valueField, valueIsToOne, valueId); })) {
                        return invalid;
                    } else {
                        return valid;
                    }
                });
            });
        } else {
            var filters = {};
            for (var f = 0; f < valueField.length; f++) {
                filters[valueField[f]] = valueId[f] || value[f];
            }
            var others = new resource.specifyModel.LazyCollection({
                filters: filters
            });
            return others.fetch().pipe(function() {
                if (_.any(others.models, function(other) { return hasSameValues(other, value, valueField, valueIsToOne, valueId); })) {
                    return invalid;
                } else {
                    return valid;
                }
            });
        }
    };


    return {
        enable: function(e) {
            return enabled = e;
        },
        areEnabled: function() {
            return enabled;
        }
    };
});
