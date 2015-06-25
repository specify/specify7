define(['jquery', 'underscore', 'specifyapi', 'whenall', 'saveblockers'], function($, _, api, whenAll, saveblockers) {
    "use strict";
    var enabled = true;

    var treeBusinessRules = {
        isTreeNode: function(resource) {
            var model;
            model = resource.specifyModel;
            return _.all(['parent', 'definition', 'definitionitem'], function(field) {
                return model.getField(field) != null;
            });
        },
        run: function(resource, fieldName) {
            if (treeBusinessRules.isTreeNode(resource) && _(['parent', 'definitionitem', 'name']).contains(fieldName)) {
                return treeBusinessRules.buildFullName(resource, [], true).pipe(function(acc) {
                    return {
                        valid: true,
                        action: function() {
                            return resource.set('fullname', acc.reverse().join(' '));
                        }
                    };
                });
            }
            return undefined;
        },
        buildFullName: function(resource, acc, start) {
            var recur;
            recur = function(parent, defitem) {
                if (start || defitem.get('isinfullname')) acc.push(resource.get('name'));
                if (!(parent != null)) {
                    return acc;
                } else {
                    return treeBusinessRules.buildFullName(parent, acc);
                }
            };
            return $.when(resource.rget('parent', true), resource.rget('definitionitem', true)).pipe(recur);
        }
    };

    var interactionBusinessRules = {
        previousReturned: [],
        previousResolved: [],
        getTotalLoaned: function(loanreturnprep) {
            if (typeof this.totalLoaned == 'undefined') {
                if (loanreturnprep.collection) {
                    this.totalLoaned = loanreturnprep.collection.related.get('quantity');
                }
            }
            return this.totalLoaned;
        },
        getTotalResolved: function(loanreturnprep) {
            //probably could just check preparation since its quantities are updated while loanreturnprep subview is open
            //But for now, iterate other returns
            if (loanreturnprep.collection) {
                return  _.reduce(loanreturnprep.collection.models, function(sum, m) {
                    if (m.cid != loanreturnprep.cid)  {
                        return sum + m.get('quantityresolved');
                    } else {
                        return sum;
                    }}, 0);
            } else {
                return loanreturnprep.get('quantityresolved');
            }
        },
        getPrepAvailability: function(interactionprep) {
            //actually need to call api to get availability?
            if (interactionprep && interactionprep.get('preparation')) {
                return interactionprep.get('preparation').get('CountAmt');
            } else {
                return undefined;
            }
        },
        updateLoanPrep: function(loanreturnprep, collection) {
            if (collection && collection.related.specifyModel.name == 'LoanPreparation') {
                var sums = _.reduce(collection.models, function(memo, lrp) {
                    memo.returned += lrp.get('quantityreturned');
                    memo.resolved += lrp.get('quantityresolved');
                    return memo;
                }, {returned: 0, resolved: 0});
                var loanprep = collection.related;
                loanprep.set('quantityreturned', sums.returned);
                loanprep.set('quantityresolved', sums.resolved);
                loanprep.set('isresolved', sums.resolved == loanprep.get('quantity'));
            }
        }
    };

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

    var BusinessRuleMgr = (function() {

        function BusinessRuleMgr(resource) {
            var _this = this;
            this.resource = resource;
            this.rules = rules[this.resource.specifyModel.name];
            this.fieldChangeDeferreds = {};
            this.watchers = {};
            this.deleteBlockers = {};
            this.rules && _.each(this.rules.deleteBlockers, function(fieldname) {
                _this.deleteBlockers[fieldname] = true;
            });
            this.isTreeNode = treeBusinessRules.isTreeNode(this.resource);
        }

        BusinessRuleMgr.prototype.setupEvents = function() {
            var _this = this;
            this.resource.on('change', this.changed, this);
            this.resource.on('add', this.added, this);
            this.resource.on('remove', this.removed, this);
            this.rules && _.each(this.resource.specifyModel.getAllFields(), function(field) {
                var fieldname = field.name.toLowerCase();
                if (field.type === 'one-to-many' && _(_this.rules.deleteBlockers).contains(fieldname)) {
                    _this.resource.on("add:" + fieldname, function() {
                        _this.addDeleteBlocker(fieldname);
                    });
                    // # possible race condition if getRelatedObject count goes through before
                    // # the deletion associated following remove event occurs
                    // # a work around might be to always do destroy({ wait: true })
                    _this.resource.on("remove:" + fieldname, function() {
                        _this.tryToRemDeleteBlocker(fieldname);
                    });
                }
            });
        };

        BusinessRuleMgr.prototype.doCustomInit = function() {
            this.rules && this.rules.customInit && this.rules.customInit(this.resource);
        };

        BusinessRuleMgr.prototype.checkCanDelete = function() {
            var _this = this;
            if (this.canDelete()) {
                this.resource.trigger('candelete');
                return $.when(true);
            } else {
                return whenAll(_.map(this.deleteBlockers, function(__, fieldname) {
                    return _this.tryToRemDeleteBlocker(fieldname);
                }));
            }
        };

        BusinessRuleMgr.prototype.canDelete = function() {
            return _.isEmpty(this.deleteBlockers);
        };

        BusinessRuleMgr.prototype.addDeleteBlocker = function(fieldname) {
            this.deleteBlockers[fieldname] = true;
            this.resource.trigger('deleteblocked');
        };

        BusinessRuleMgr.prototype.tryToRemDeleteBlocker = function(fieldname) {
            var _this = this;
            return this.resource.getRelatedObjectCount(fieldname).done(function(count) {
                if (count < 1) {
                    delete _this.deleteBlockers[fieldname];
                    if (_this.canDelete()) _this.resource.trigger('candelete');
                }
            });
        };

        BusinessRuleMgr.prototype.changed = function(resource) {
            var _this = this;
            if (!resource._fetch && !resource._save) {
                _.each(resource.changed, function(__, fieldName) {
                    _this.checkField(fieldName);
                });
            }
        };

        BusinessRuleMgr.prototype.added = function(resource, collection) {
            if (resource.specifyModel && resource.specifyModel.getField('ordinal')) {
                resource.set('ordinal', collection.indexOf(resource));
            }
            this.rules && this.rules.onAdded && this.rules.onAdded(resource, collection);
        };

        BusinessRuleMgr.prototype.removed = function(resource, collection) {
            this.rules && this.rules.onRemoved && this.rules.onRemoved(resource, collection);
        };

        BusinessRuleMgr.prototype.checkField = function(fieldName) {
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
        };

        BusinessRuleMgr.prototype.doCustomCheck = function(fieldName) {
            return this.rules
                && this.rules.customChecks
                && this.rules.customChecks[fieldName]
                && this.rules.customChecks[fieldName](this.resource);
        };

        BusinessRuleMgr.prototype.checkUnique = function(fieldName) {
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
        };

        return BusinessRuleMgr;

    })();

    var combineUniquenessResults = function(deferredResults) {
        return whenAll(deferredResults).pipe(function(results) {
            var invalids = _.filter(results, function(result) {
                return !result.valid;
            });
            return (invalids.length < 1) ? {valid: true} : {valid: false, reason: _(invalids).pluck('reason').join(', ')};
        });
    };

    var uniqueIn = function(toOneField, resource, valueFieldArg) {
        var valueField = $.isArray(valueFieldArg) ? valueFieldArg : [valueFieldArg];
        var valid = {
            valid: true
        };
        var invalid = {
            valid: false,
            reason: "Value must be unique to " + (toOneField || 'database')
        };
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
            var fieldInfo = resource.specifyModel.getField(toOneField);
            var haveLocalColl = (resource.collection && resource.collection.related &&
                                 fieldInfo.getRelatedModel() === resource.collection.related.specifyModel);

            var localCollection = haveLocalColl ? _.compact(resource.collection.models) : [];
            var dupes = _.filter(localCollection, function(other) { return hasSameValues(other, value, valueField, valueIsToOne, valueId); });
            if (dupes.length > 0) {
                invalid.localDupes = dupes;
                return $.when(invalid);
            }
            return resource.rget(toOneField).pipe(function(related) {
                if (!related) return valid;
                var filters = {};
                filters[valueField] = valueId || value;
                var others = new resource.specifyModel.ToOneCollection({
                    related: related,
                    field: fieldInfo,
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
            filters[valueField] = valueId || value;
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

    var uniqueOld = function(toOneField, resource, valueField) {
        var valid = {
            valid: true
        };
        var invalid = {
            valid: false,
            reason: "Value must be unique to " + (toOneField || 'database')
        };
        var value = resource.get(valueField);
        var valueFieldInfo = resource.specifyModel.getField(valueField);
        var valueIsToOne = valueFieldInfo.type === 'many-to-one';
        if (valueIsToOne) {
            if (_.isNull(value)) return $.when(valid);
            var valueId = _.isString(value) ? valueFieldInfo.getRelatedModel().Resource.fromUri(value).id : value.id;
        }
        var hasSameValue = function(other) {
            if ((other.id != null) && other.id === resource.id) return false;
            if (other.cid === resource.cid) return false;
            var otherVal = other.get(valueField);
            if (valueIsToOne && !(_.isString(otherVal))) {
                return parseInt(otherVal.id, 10) === parseInt(valueId, 10);
            } else {
                return value === other.get(valueField);
            }
        };
        if (toOneField != null) {
            var fieldInfo = resource.specifyModel.getField(toOneField);
            var haveLocalColl = (resource.collection && resource.collection.related &&
                                 fieldInfo.getRelatedModel() === resource.collection.related.specifyModel);

            var localCollection = haveLocalColl ? _.compact(resource.collection.models) : [];
            var dupes = _.filter(localCollection, hasSameValue);
            if (dupes.length > 0) {
                invalid.localDupes = dupes;
                return $.when(invalid);
            }
            return resource.rget(toOneField).pipe(function(related) {
                if (!related) return valid;
                var filters = {};
                filters[valueField] = valueId || value;
                var others = new resource.specifyModel.ToOneCollection({
                    related: related,
                    field: fieldInfo,
                    filters: filters
                });
                return others.fetch().pipe(function() {
                    var inDatabase = others.chain().compact();
                    inDatabase = haveLocalColl ? inDatabase.filter(function(other) {
                        return !(resource.collection.get(other.id));
                    }).value() : inDatabase.value();
                    if (_.any(inDatabase, hasSameValue)) {
                        return invalid;
                    } else {
                        return valid;
                    }
                });
            });
        } else {
            var filters = {};
            filters[valueField] = valueId || value;
            var others = new resource.specifyModel.LazyCollection({
                filters: filters
            });
            return others.fetch().pipe(function() {
                if (_.any(others.models, hasSameValue)) {
                    return invalid;
                } else {
                    return valid;
                }
            });
        }
    };

    var rules = {
        Accession: {
            deleteBlockers: ['collectionobjects'],
            uniqueIn: {
                accessionnumber: 'division'
            }
        },
        AccessionAgent: {
            uniqueIn: {
                role: ['accession', 'repositoryagreement']
            }
        },
        Agent: {
            deleteBlockers: ['catalogerof']
        },
        Appraisal: {
            uniqueIn: {
                appraisalnumber: 'accession'
            }
        },
        Author: {
            uniqueIn: {
                agent: 'referencework'
            }
        },
        BorrowAgent: {
            uniqueIn: {
                role: {field: 'borrow', otherfields: ['agent']},
                agent: {field: 'borrow', otherfields: ['role']}
            }
        },
        BorrowMaterial: {
            customChecks: {
                quantityreturned: function(borrowmaterial) {
                    var returned = borrowmaterial.get('quantityreturned');
                    var newval;
                    if (returned > borrowmaterial.get('quantity')) {
                        /*return {
                            valid: false,
                            reason: 'value must be < ' + borrowmaterial.get('quantity')
                        };*/
                        newval = borrowmaterial.get('quantity');
                    }
                    if (returned > borrowmaterial.get('quantityresolved')) {
                        /*return {
                            valid: false,
                            reason: 'quantity returned must be less than or equal to quantity resolved'
                         };*/
                        newval = borrowmaterial.get('quantityresolved');
                    }
                    newval && borrowmaterial.set('quantityreturned', newval);
                },
                quantityresolved: function(borrowmaterial) {
                    var resolved = borrowmaterial.get('quantityresolved');
                    var newval;
                    if (resolved > borrowmaterial.get('quantity')) {
                        /*return {
                            valid: false,
                            reason: 'value must be < ' + borrowmaterial.get('quantity')
                        };*/
                        newval = borrowmaterial.get('quantity');
                    }
                    if (resolved < borrowmaterial.get('quantityreturned')) {
                        /*return {
                            valid: false,
                            reason: 'quantity resolved must be greater than or equal to quantity returned'
                        };*/
                        newval = borrowmaterial.get('quantityreturned');
                    }
                    newval && borrowmaterial.set('quantityresolved', newval);
                }
            }
        },
        Collection: {
            deleteBlockers: ['collectionobjects'],
            uniqueIn: {
                name: 'discipline'
            }
        },
        CollectingEvent: {
            deleteBlockers: ['collectionobjects']
        },
        CollectionObject: {
            uniqueIn: {
                catalognumber: 'collection'
            }
        },
        Collector: {
            uniqueIn: {
                agent: 'collectingevent'
            }
        },
        Determination: {
            onRemoved: function(det, detCollection) {
                // Example usage:
                // if (detCollection.related.specifyModel.name == 'CollectionObject') {
                //     var collectionobject = detCollection.related;
                //     console.log("removed determination", det, "from collection object", collectionobject);
                // }
            },
            onAdded: function(det, detCollection) {
                // Example usage:
                // if (detCollection.related.specifyModel.name == 'CollectionObject') {
                //     var collectionobject = detCollection.related;
                //     console.log("added determination", det, "to collection object", collectionobject);
                // }
            },
            customInit: function(determination) {
                if (determination.isNew()) {
                    var setCurrentIfNoneIsSet = function() {
                        if (!(determination.collection.any(function(other) {
                            return other.get('iscurrent');
                        }))) {
                            determination.set('iscurrent', true);
                        }
                    };
                    if (determination.collection != null) setCurrentIfNoneIsSet();
                    determination.on('add', setCurrentIfNoneIsSet);
                }
            },
            customChecks: {
                taxon: function(determination) {
                    return determination.rget('taxon', true).pipe(function(taxon) {
                        if (!(taxon != null)) {
                            determination.set('preferredtaxon', null);
                            return {
                                valid: true
                            };
                        }
                        var recur = function(taxon) {
                            if (!taxon.get('isaccepted') && taxon.get('acceptedtaxon')) {
                                return taxon.rget('acceptedtaxon', true).pipe(recur);
                            } else {
                                determination.set('preferredtaxon', taxon);
                                return {valid: true};
                            }
                        };
                        return recur(taxon);
                    });
                },
                iscurrent: function(determination) {
                    if (determination.get('iscurrent') && (determination.collection != null)) {
                        determination.collection.each(function(other) {
                            if (other.cid !== determination.cid) {
                                other.set('iscurrent', false);
                            }
                        });
                    }
                    return {valid: true};
                }
            }
        },
        Discipline: {
            uniqueIn: {
                name: 'division'
            }
        },
        Division: {
            uniqueIn: {
                name: 'institution'
            }
        },
        Gift: {
            uniqueIn: {
                giftnumber: 'discipline'
            }
        },
        GiftPreparation: {
            customChecks: {
                quantity: function(giftprep) {
                    if (interactionBusinessRules.getPrepAvailability() < giftprep.get('quantity')) {
                        giftprep.set('quantity', interactionBusinessRules.getPrepAvailability());
                    }
                }
            }
        },
        Institution: {
            unique: ['name']
        },
        Journal: {
            deleteBlockers: ['referenceworks']
        },
        Loan: {
            uniqueIn: {
                loannumber: 'discipline'
            }
        },
        LoanReturnPreparation: {
            onRemoved: function(loanreturnprep, collection) {
              interactionBusinessRules.updateLoanPrep(loanreturnprep, collection);
            },
            customInit: function(loanreturnprep) {
                interactionBusinessRules.totalLoaned = undefined;
                interactionBusinessRules.totalResolved = undefined;
                interactionBusinessRules.returned = undefined;
                interactionBusinessRules.resolved = undefined;
                if (loanreturnprep.isNew()) {
                    loanreturnprep.set('quantityreturned', 0);
                    loanreturnprep.set('quantityresolved', 0);
                }
            },
            customChecks: {
                quantityreturned: function(loanreturnprep) {
                    var returned = loanreturnprep.get('quantityreturned');
                    var previousReturned = interactionBusinessRules.previousReturned[loanreturnprep.cid]
                            ? interactionBusinessRules.previousReturned[loanreturnprep.cid]
                            : 0;
                    if (returned != previousReturned) {
                        var delta = returned - previousReturned;
                        var resolved = loanreturnprep.get('quantityresolved');
                        var totalLoaned = interactionBusinessRules.getTotalLoaned(loanreturnprep);
                        var totalResolved = interactionBusinessRules.getTotalResolved(loanreturnprep);
                        var max = totalLoaned - totalResolved;
                        if (delta + resolved > max) {
                            loanreturnprep.set('quantityreturned', previousReturned);
                        } else {
                            resolved = loanreturnprep.get('quantityresolved') + delta;
                            interactionBusinessRules.previousResolved[loanreturnprep.cid] = resolved;
                            loanreturnprep.set('quantityresolved', resolved);
                        }
                        interactionBusinessRules.previousReturned[loanreturnprep.cid] = loanreturnprep.get('quantityreturned');
                        interactionBusinessRules.updateLoanPrep(loanreturnprep, loanreturnprep.collection);
                    }
                },
                quantityresolved: function(loanreturnprep) {
                    var resolved = loanreturnprep.get('quantityresolved');
                    var previousResolved = interactionBusinessRules.previousResolved[loanreturnprep.cid]
                            ? interactionBusinessRules.previousResolved[loanreturnprep.cid]
                           : 0;
                    if (resolved != previousResolved) {
                        var returned = loanreturnprep.get('quantityreturned');
                        var totalLoaned = interactionBusinessRules.getTotalLoaned(loanreturnprep);
                        var totalResolved = interactionBusinessRules.getTotalResolved(loanreturnprep);
                        var max = totalLoaned - totalResolved;
                        if (resolved > max) {
                            loanreturnprep.set('quantityresolved', previousResolved);
                        }
                        if (resolved < returned) {
                            interactionBusinessRules.previousReturned[loanreturnprep.cid] = resolved;
                            loanreturnprep.set('quantityreturned', resolved);
                        }
                        interactionBusinessRules.previousResolved[loanreturnprep.cid] = loanreturnprep.get('quantityresolved');
                        interactionBusinessRules.updateLoanPrep(loanreturnprep, loanreturnprep.collection);
                    }
                }
            }
        },
        Locality: {
            deleteBlockers: ['collectingevents']
        },
        Permit: {
            unique: ['permitnumber']
        },
        Picklist: {
            uniqueIn: {
                name: 'collection'
            }
        },
        Preparation: {
            deleteBlockers: ['preparationattachments']
        },
        PrepType: {
            deleteBlockers: ['preparations'],
            uniqueIn: {
                name: 'collection'
            }
        },
        Repositoryagreement: {
            deleteBlockers: ['accessions'],
            uniqueIn: {
                repositoryagreementnumber: 'division'
            }
        },
        Shipment: {
            customChecks: {
                shippedto: function(shipment) {
                    return shipment.rget('shippedto.addresses').pipe(function(addresses) {
                        return {
                            valid: addresses.length > 0,
                            reason: "Shipped to agent must have an address.",
                            key: "br-shippedto-address"
                        };
                    });
                }
            }
        }
    };

    var businessRules = {
        enable: function(e) {
            return enabled = e;
        },
        areEnabled: function() {
            return enabled;
        }
    };

    return businessRules;
});
