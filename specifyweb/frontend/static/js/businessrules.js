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
        getTotalLoaned: function(loanreturnprep) {
            if (typeof this.totalLoaned == 'undefined') {
                    this.totalLoaned = loanreturnprep.collection.related.get('quantity');
            }
            return this.totalLoaned;
        },
        getTotalResolved: function(loanreturnprep) {
            //maybe could just check preparation if it's quantities were updated while loanreturnprep subview was open
            // for now to iterate other returns
            if (typeof this.totalResolved == 'undefined') {
                this.totalResolved = _.reduce(loanreturnprep.models, function(sum, m) {
                    if (m.cid != loanreturnprep.cid)  {
                        return sum + m.quantityresolved;
                    } else {
                        return sum;
                    }}, 0);
            }
            return this.totalResolved;
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
            this.rules && this.rules.add && this.rules.add['loanreturnpreparations']
                && this.rules.add['loanreturnpreparations'](resource);
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
            this.rules
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
                results = _.map(toOneFields, function(field) { return uniqueIn(field, _this.resource, fieldName); });
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
            var result = combineUniquenessResults(results);
            result.key = 'br-uniqueness-' + fieldName;
            return result;
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

    var uniqueIn = function(toOneField, resource, valueField) {
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
                role: 'borrow'
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
        LoanPreparation: {
            add: {
                loanreturnpreparations: function(loanprep) {
                    var lrps = loanprep.get('loanreturnpreparations');
                }
            },
            remove: {
                loanreturnpreparations: function(loanprep) {
                    var lrps = loanprep.get('loanreturnpreparations');
               }
            },
            customChecks: {
                loanreturnpreparations: function(loanprep) {
                    var lrps = loanprep.dependentResources.loanreturnpreparations.models;
                    var sums = _.reduce(lrps, function(memo, lrp) {
                        memo.returned += lrp.get('quantityreturned');
                        memo.resolved += lrp.get('quantityresolved');
                        return memo;
                    }, {returned: 0, resolved: 0});
                    loanprep.set('quantityreturned', sums.returned);
                    loanprep.set('quantityresolved', sums.resolved);
                }
            }
        },
        LoanReturnPreparation: {
            customInit: function(loanreturnprep) {
                interactionBusinessRules.totalLoaned = undefined;
                interactionBusinessRules.totalResolved = undefined;
                interactionBusinessRules.returned = undefined;
                interactionBusinessRules.resolved = undefined;
            },
            customChecks: {
                quantityreturned: function(loanreturnprep) {
                    var returned = loanreturnprep.get('quantityreturned');
                    var resolved = loanreturnprep.get('quantityresolved');
                    var totalLoaned = interactionBusinessRules.getTotalLoaned(loanreturnprep);
                    var totalResolved = interactionBusinessRules.getTotalResolved(loanreturnprep);
                    var max = totalLoaned - totalResolved;
                    if (resolved > max) {
                        loanreturnprep.set('quantityresolved', max);
                    }
                },
                quantityresolved: function(loanreturnprep) {
                    var returned = loanreturnprep.get('quantityreturned');
                    var resolved = loanreturnprep.get('quantityresolved');
                    var totalLoaned = interactionBusinessRules.getTotalLoaned(loanreturnprep);
                    var totalResolved = interactionBusinessRules.getTotalResolved(loanreturnprep);
                    var max = totalLoaned - totalResolved;
                    if (resolved > max) {
                        loanreturnprep.set('quantityresolved', max);
                    }
                }
            }
        },
        Locality: {
            deleteBlockers: ['collectingevents']
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
