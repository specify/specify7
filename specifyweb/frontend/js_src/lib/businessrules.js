"use strict";

var $                 = require('jquery');
var _                 = require('underscore');
var Q                 = require('q');
var api               = require('./specifyapi.js');
var saveblockers      = require('./saveblockers.js');
var treeBusinessRules = require('./treebusinessrules.js');
var rules             = require('./businessruledefs.js');

    var enabled = true;

    api.on('initresource', function(resource) {
        if (enabled && !resource.noBusinessRules) attachTo(resource);
    });

    var attachTo = function(resource) {
        var mgr;
        mgr = resource.businessRuleMgr = new BusinessRuleMgr(resource);
        mgr.setupEvents();
        resource.saveBlockers = new saveblockers.SaveBlockers(resource);
        mgr.isTreeNode && treeBusinessRules.init(resource);
        mgr.doCustomInit();
    };

    function BusinessRuleMgr(resource) {
        this.resource = resource;
        this.rules = rules[this.resource.specifyModel.name];
        this.pending = Q(null);
        this.fieldChangePromises = {};
        this.watchers = {};
        this.isTreeNode = treeBusinessRules.isTreeNode(this.resource);
    }

    _(BusinessRuleMgr.prototype).extend({
        addPromise: function(promise) {
            this.pending = Q.allSettled([this.pending, promise]).thenResolve(null);
        },

        setupEvents: function() {
            this.resource.on('change', this.changed, this);
            this.resource.on('add', this.added, this);
            this.resource.on('remove', this.removed, this);
        },

        invokeRule: function(ruleName, fieldName, args) {
            var resource = this.resource;
            var promise = this._invokeRule(ruleName, fieldName, args);
            var msg = 'BR ' + ruleName + (fieldName ? '[' + fieldName + '] ': ' ') + 'finished on';
            // promise.then(function(result) { console.debug(msg, resource, {args: args, result: result}); });
        },
        _invokeRule: function(ruleName, fieldName, args) {
            var rule = this.rules && this.rules[ruleName];
            if (!rule) return Q('no rule: ' + ruleName);
            if (fieldName) {
                rule = rule[fieldName];
                if (!rule) return Q('no rule: ' + ruleName + ' for: ' + fieldName);
            }
            return Q(rule.apply(this, args));
        },

        doCustomInit: function() {
            this.addPromise(
                this.invokeRule('customInit', null, [this.resource]));
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
            this.addPromise(
                this.invokeRule('onAdded', null, [resource, collection]));
        },

        removed: function(resource, collection) {
            this.addPromise(
                this.invokeRule('onRemoved', null, [resource, collection]));
        },

        checkField: function(fieldName) {
            fieldName = fieldName.toLowerCase();

            var thisCheck = Q.defer();
            // thisCheck.promise.then(function(result) { console.debug('BR finished checkField',
            //                                                         {field: fieldName, result: result}); });
            this.addPromise(thisCheck.promise);

            // If another change happens while the previous check is pending,
            // that check is superseded by checking the new value.
            this.fieldChangePromises[fieldName] && this.fieldChangePromises[fieldName].resolve('superseded');
            this.fieldChangePromises[fieldName] = thisCheck;

            var checks = [
                this.invokeRule('customChecks', fieldName, [this.resource]),
                this.checkUnique(fieldName)
            ];

            this.isTreeNode && checks.push(treeBusinessRules.run(this.resource, fieldName));

            Q.all(checks).then(function(results) {
                // Only process these results if the change has not been superseded.
                return (thisCheck === this.fieldChangePromises[fieldName]) &&
                    this.processCheckFieldResults(fieldName, results);
            }.bind(this)).then(function() { thisCheck.resolve('finished'); });
        },
        processCheckFieldResults: function(fieldName, results) {
            var resource = this.resource;
            return Q.all(results.map(function(result) {
                if (!result) return null;
                if (!result.valid) {
                    resource.saveBlockers.add(result.key, fieldName, result.reason);
                } else {
                    resource.saveBlockers.remove(result.key);
                }
                return result.action && result.action();
            }));
        },
        checkUnique: function(fieldName) {
            var _this = this;
            var results;
            if (this.rules && this.rules.unique && _(this.rules.unique).contains(fieldName)) {
                // field value is required to be globally unique.
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
                    return uniqueIn(field, _this.resource, fieldNames);
                });
            }
            Q.all(results).then(function(results) {
                _.chain(results).pluck('localDupes').compact().flatten().each(function(dup) {
                    var event = dup.cid + ':' + fieldName;
                    if (_this.watchers[event]) return;
                    _this.watchers[event] = dup.on('change remove', function() {
                        _this.checkField(fieldName);
                    });
                });
            });
            return combineUniquenessResults(results).then(function(result) {
                // console.debug('BR finished checkUnique for', fieldName, result);
                result.key = 'br-uniqueness-' + fieldName;
                return result;
            });
        }
    });


    var combineUniquenessResults = function(deferredResults) {
        return Q.all(deferredResults).then(function(results) {
            var invalids = _.filter(results, function(result) { return !result.valid; });
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
            return Q(valid);
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
                return Q(invalid);
            }
            return Q(resource.rget(toOneField)).then(function(related) {
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
                return Q(others.fetch()).then(function() {
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
            return Q(others.fetch()).then(function() {
                if (_.any(others.models, function(other) { return hasSameValues(other, value, valueField, valueIsToOne, valueId); })) {
                    return invalid;
                } else {
                    return valid;
                }
            });
        }
    };


module.exports = {
        enable: function(e) {
            return enabled = e;
        },
        areEnabled: function() {
            return enabled;
        }
    };

