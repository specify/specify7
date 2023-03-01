import _ from 'underscore';

import {formsText} from '../../localization/forms';
import {flippedPromise} from '../../utils/promise';
import {formatConjunction} from '../Atoms/Internationalization';
import {isTreeResource} from '../InitialContext/treeRanks';
import {businessRuleDefs} from './businessRuleDefs';
import {idFromUrl} from './resource';
import {SaveBlockers} from './saveBlockers';
import {initializeTreeRecord, treeBusinessRules} from './treeBusinessRules';

let enabled = true;

    export function attachBusinessRules(resource) {
        if(!enabled) return;
        let mgr;
        mgr = resource.businessRuleMgr = new BusinessRuleMgr(resource);
        mgr.setupEvents();
        resource.saveBlockers = new SaveBlockers(resource);
        if(isTreeResource(resource))
            initializeTreeRecord(resource);
        mgr.doCustomInit();
    }

    function BusinessRuleMgr(resource) {
        this.resource = resource;
        this.rules = businessRuleDefs[this.resource.specifyModel.name];
        this.pending = Promise.resolve(null);
        this.fieldChangePromises = {};
        this.watchers = {};
    }

    _(BusinessRuleMgr.prototype).extend({
        addPromise(promise) {
            this.pending = Promise.allSettled([this.pending, promise]).then(()=>null);
        },

        setupEvents() {
            this.resource.on('change', this.changed, this);
            this.resource.on('add', this.added, this);
            this.resource.on('remove', this.removed, this);
        },

        invokeRule(ruleName, fieldName, args) {
            /*
             * Var resource = this.resource;
             * var msg = 'BR ' + ruleName + (fieldName ? '[' + fieldName + '] ': ' ') + 'finished on';
             * promise.then(function(result) { console.debug(msg, resource, {args: args, result: result}); });
             */
            return this._invokeRule(ruleName, fieldName, args);
        },
        async _invokeRule(ruleName, fieldName, args) {
            let rule = this.rules && this.rules[ruleName];
            if (!rule) return `no rule: ${  ruleName}`;
            if (fieldName) {
                rule = rule[fieldName];
                if (!rule) return `no rule: ${  ruleName  } for: ${  fieldName}`;
            }
            return rule.apply(this, args);
        },

        doCustomInit() {
            this.addPromise(
                this.invokeRule('customInit', null, [this.resource]));
        },

        changed(resource) {
            if (!resource._fetch && !resource._save) {
                _.each(resource.changed, function(__, fieldName) {
                    this.checkField(fieldName);
                }, this);
            }
        },

        added(resource, collection) {
            if (resource.specifyModel && resource.specifyModel.getField('ordinal')) {
                resource.set('ordinal', collection.indexOf(resource));
            }
            this.addPromise(
                this.invokeRule('onAdded', null, [resource, collection]));
        },

        removed(resource, collection) {
            this.addPromise(
                this.invokeRule('onRemoved', null, [resource, collection]));
        },

        checkField(fieldName) {
            fieldName = fieldName.toLowerCase();

            const thisCheck  = flippedPromise();
            /*
             * ThisCheck.promise.then(function(result) { console.debug('BR finished checkField',
             *                                                         {field: fieldName, result: result}); });
             */
            this.addPromise(thisCheck);

            /*
             * If another change happens while the previous check is pending,
             * that check is superseded by checking the new value.
             */
            this.fieldChangePromises[fieldName] && this.fieldChangePromises[fieldName].resolve('superseded');
            this.fieldChangePromises[fieldName] = thisCheck;

            const checks = [
                this.invokeRule('customChecks', fieldName, [this.resource]),
                this.checkUnique(fieldName)
            ];

            if(isTreeResource(this.resource))
                checks.push(treeBusinessRules(this.resource, fieldName));

            Promise.all(checks).then((results) =>
                // Only process these results if the change has not been superseded
                 (thisCheck === this.fieldChangePromises[fieldName]) &&
                    this.processCheckFieldResults(fieldName, results)
            ).then(() => { thisCheck.resolve('finished'); });
        },
        async processCheckFieldResults(fieldName, results) {
            const resource = this.resource;
            return Promise.all(results.map((result) => {
                if (!result) return null;
                if (result.valid === false) {
                    resource.saveBlockers?.add(result.key, fieldName, result.reason);
                } else if (result.valid === true) {
                    resource.saveBlockers?.remove(result.key);
                }
                return result.action && result.action();
            }));
        },
        async checkUnique(fieldName) {
            const _this = this;
            let results;
            if (this.rules && this.rules.unique && _(this.rules.unique).contains(fieldName)) {
                // Field value is required to be globally unique.
                results = [uniqueIn(null, this.resource, fieldName)];
            } else {
                let toOneFields = (this.rules && this.rules.uniqueIn && this.rules.uniqueIn[fieldName]) || [];
                if (!_.isArray(toOneFields)) toOneFields = [toOneFields];
                results = _.map(toOneFields, (def) => {
                    let field = def;
                    let fieldNames = [fieldName];
                    if (typeof def !== 'string') {
                        fieldNames = fieldNames.concat(def.otherfields);
                        field = def.field;
                    }
                    return uniqueIn(field, _this.resource, fieldNames);
                });
            }
            Promise.all(results).then((results) => {
                _.chain(results).pluck('localDupes').compact().flatten().each((dup) => {
                    const event = `${dup.cid  }:${  fieldName}`;
                    if (_this.watchers[event]) return;
                    _this.watchers[event] = dup.on('change remove', () => {
                        _this.checkField(fieldName);
                    });
                });
            });
            return combineUniquenessResults(results).then((result) => {
                // Console.debug('BR finished checkUnique for', fieldName, result);
                result.key = `br-uniqueness-${  fieldName}`;
                return result;
            });
        }
    });


    var combineUniquenessResults = async function(deferredResults) {
        return Promise.all(deferredResults).then((results) => {
            const invalids = _.filter(results, (result) => !result.valid);
            return invalids.length === 0
                ? {valid: true}
                : {
                    valid: false,
                    reason: formatConjunction(_(invalids).pluck('reason'))
                };
        });
    };

    const getUniqueInInvalidReason = function(parentFldInfo, fldInfo) {
        if (fldInfo.length > 1)
          return parentFldInfo
            ? formsText.valuesOfMustBeUniqueToField({
                values: formatConjunction(fldInfo.map((fld) => fld.label)),
                fieldName: parentFldInfo.label,
              })
            : formsText.valuesOfMustBeUniqueToDatabase({
                values: formatConjunction(fldInfo.map((fld) => fld.label))
              });
        else
          return parentFldInfo
            ? formsText.valueMustBeUniqueToField({fieldName: parentFldInfo.label})
            : formsText.valueMustBeUniqueToDatabase();
    };

    var uniqueIn = function(toOneField, resource, valueFieldArgument) {
        const valueField = Array.isArray(valueFieldArgument) ? valueFieldArgument : [valueFieldArgument];
        const value = _.map(valueField, (v) => resource.get(v));
        const valueFieldInfo = _.map(valueField, (v) => resource.specifyModel.getField(v));
        const valueIsToOne = _.map(valueFieldInfo, (fi) => fi.type === 'many-to-one');
        const valueId = _.map(value, (v, index) => {
            if (valueIsToOne[index]) {
                if (_.isNull(v) || v === undefined)  {
                    return null;
                } else {
                    return _.isString(v) ? idFromUrl(v) : v.id;
                }
            } else {
                return undefined;
            }
        });

        const toOneFieldInfo = toOneField ? resource.specifyModel.getField(toOneField) : undefined;
        const valid = {
            valid: true
        };
        const invalid = {
            valid: false,
            reason: getUniqueInInvalidReason(toOneFieldInfo, valueFieldInfo)
        };

        const allNullOrUndefinedToOnes = _.reduce(valueId, (result, v, index) => result &&
                valueIsToOne[index] ? _.isNull(valueId[index]) : false, true);
        if (allNullOrUndefinedToOnes) {
            return Promise.resolve(valid);
        }

        const hasSameValue = function(other, value, valueField, valueIsToOne, valueId) {
            if ((other.id != null) && other.id === resource.id) return false;
            if (other.cid === resource.cid) return false;
            const otherValue = other.get(valueField);
            return valueIsToOne && otherValue !== undefined && !(_.isString(otherValue)) ? Number.parseInt(otherValue.id) === Number.parseInt(valueId) : value === otherValue;
        };

        const hasSameValues = function(other, values, valueFields, valuesAreToOne, valueIds) {
            return _.reduce(values, (result, value_, index) => result && hasSameValue(other, value_, valueFields[index], valuesAreToOne[index], valueIds[index]), true);
        };

        if (toOneField == null) {
            const filters = {};
            for (const [f, element] of valueField.entries()) {
                filters[element] = valueId[f] || value[f];
            }
            const others = new resource.specifyModel.LazyCollection({
                filters
            });
            return others.fetch().then(() => _.any(others.models, (other) => hasSameValues(other, value, valueField, valueIsToOne, valueId)) ? invalid : valid);
        } else {
            const haveLocalColl = (resource.collection && resource.collection.related &&
                                 toOneFieldInfo.relatedModel === resource.collection.related.specifyModel);

            const localCollection = haveLocalColl ? _.compact(resource.collection.models) : [];
            const dupes = _.filter(localCollection, (other) => hasSameValues(other, value, valueField, valueIsToOne, valueId));
            if (dupes.length > 0) {
                invalid.localDupes = dupes;
                return Promise.resolve(invalid);
            }
            return resource.rget(toOneField).then((related) => {
                if (!related) return valid;
                const filters = {};
                for (const [f, element] of valueField.entries()) {
                    filters[element] = valueId[f] || value[f];
                }
                const others = new resource.specifyModel.ToOneCollection({
                    related,
                    field: toOneFieldInfo,
                    filters
                });
                return others.fetch().then(() => {
                    let inDatabase = others.chain().compact();
                    inDatabase = haveLocalColl ? inDatabase.filter((other) => !(resource.collection.get(other.id))).value() : inDatabase.value();
                    return _.any(inDatabase, (other) => hasSameValues(other, value, valueField, valueIsToOne, valueId)) ? invalid : valid;
                });
            });
        }
    };


export function enableBusinessRules(e) {
    return enabled = e;
}
