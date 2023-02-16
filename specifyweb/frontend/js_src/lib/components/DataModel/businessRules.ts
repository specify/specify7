import { overwriteReadOnly, RA } from '../../utils/types';
import { AnySchema, AnyTree } from './helperTypes';
import { SpecifyResource } from './legacyTypes';
import { BusinessRuleDefs, businessRuleDefs } from './businessRuleDefs';
import { flippedPromise } from '../../utils/promise';
import { isTreeResource } from '../InitialContext/treeRanks';
import { initializeTreeRecord, treeBusinessRules } from './treeBusinessRules';
import _ from 'underscore';
import { Collection } from './specifyModel';
import { SaveBlockers } from './saveBlockers';
import { formatConjunction } from '../Atoms/Internationalization';
import { formsText } from '../../localization/forms';
import { LiteralField, Relationship } from './specifyField';
import { idFromUrl } from './resource';
import { globalEvents } from '../../utils/ajax/specifyApi';

var enabled: boolean = true;

globalEvents.on('initResource', (resource) => {
  enabled && !resource.noBusinessRules
    ? attachBusinessRules(resource)
    : undefined;
});

export function enableBusinessRules(e: boolean) {
  return (enabled = e);
}

export class BusinessRuleMgr<SCHEMA extends AnySchema> {
  private readonly resource: SpecifyResource<SCHEMA>;
  private readonly rules: BusinessRuleDefs<SCHEMA> | undefined;
  public pendingPromises: Promise<BusinessRuleResult | null> =
    Promise.resolve(null);
  private fieldChangePromises: {
    [key: string]: Promise<BusinessRuleResult> | Promise<string>;
  } = {};
  private watchers: { [key: string]: () => void } = {};

  public constructor(resource: SpecifyResource<SCHEMA>) {
    this.resource = resource;
    this.rules = businessRuleDefs()[this.resource.specifyModel.name];
  }

  private addPromise(promise: Promise<BusinessRuleResult | void>): void {
    this.pendingPromises = Promise.allSettled([
      this.pendingPromises,
      promise,
    ]).then(() => null);
  }

  private changed(resource: SpecifyResource<SCHEMA>): void {
    if (resource.changed !== undefined) {
      Object.keys(resource.changed).forEach((field) => {
        this.checkField(field);
      });
    }
  }

  private removed(
    resource: SpecifyResource<SCHEMA>,
    collection: Collection<SCHEMA>
  ): void {
    this.addPromise(
      this.invokeRule('onRemoved', undefined, [resource, collection])
    );
  }

  public setUpManager(): void {
    this.addPromise(this.invokeRule('customInit', undefined, [this.resource]));
    if (isTreeResource(this.resource as SpecifyResource<AnySchema>))
      initializeTreeRecord(this.resource as SpecifyResource<AnyTree>);

    this.resource.on('change', this.changed, this);
    this.resource.on('remove', this.removed, this);
  }

  public checkField(fieldName: string) {
    fieldName = fieldName.toLocaleLowerCase();
    const thisCheck: Promise<BusinessRuleResult> = flippedPromise();
    this.addPromise(thisCheck);

    this.fieldChangePromises[fieldName] !== undefined &&
      this.fieldChangePromises[fieldName].resolve('superseded');
    this.fieldChangePromises[fieldName] = thisCheck;

    var checks = [
      this.invokeRule('fieldChecks', fieldName, [this.resource]),
      this.checkUnique(fieldName),
    ];

    if (isTreeResource(this.resource as SpecifyResource<AnySchema>))
      checks.push(
        treeBusinessRules(this.resource as SpecifyResource<AnyTree>, fieldName)
      );

    const _this = this;

    Promise.all(checks)
      .then((results) => {
        return (
          thisCheck === _this.fieldChangePromises[fieldName] &&
          _this.processCheckFieldResults(fieldName, results)
        );
      })
      .then(() => {
        resolveFlippedPromise(thisCheck, 'finished');
      });
  }

  private processCheckFieldResults(
    fieldName: string,
    results: RA<BusinessRuleResult | undefined>
  ): Promise<(void | null)[]> {
    return Promise.all(
      results.map((result) => {
        if (!result) return null;
        if (result.key === undefined) {
          if (result.valid)
            return typeof result.action === 'function' ? result.action() : null;
          return null;
        }
        if (result.valid === false) {
          this.resource.saveBlockers!.add(result.key, fieldName, result.reason);
        } else {
          this.resource.saveBlockers!.remove(result.key);
          return typeof result.action === 'function' ? result.action() : null;
        }
      })
    );
  }

  private async checkUnique(fieldName: string): Promise<BusinessRuleResult> {
    const _this = this;
    var toOneFields: RA<any> =
      (this.rules?.uniqueIn && this.rules.uniqueIn[fieldName]) ?? [];

    const results = toOneFields.map((uniqueRule) => {
      var field = uniqueRule;
      var fieldNames: string[] | null = [];
      if (uniqueRule === null) {
        fieldNames = null;
      } else if (typeof uniqueRule != 'string') {
        fieldNames = fieldNames.concat(uniqueRule.otherfields);
        field = uniqueRule.field;
      } else fieldNames = [fieldName];
      return _this.uniqueIn(field, fieldNames);
    });

    Promise.all(results).then((results) => {
      _.chain(results)
        .pluck('localDuplicates')
        .compact()
        .flatten()
        .each((duplicate: SpecifyResource<SCHEMA>) => {
          const event = duplicate.cid + ':' + fieldName;
          if (_this.watchers[event]) {
            return;
          }
          _this.watchers[event] = () =>
            duplicate.on('change remove', () => {
              _this.checkField(fieldName);
            });
        });
    });
    return Promise.all(results).then((results) => {
      const invalids = results.filter((result) => {
        return !result.valid;
      });
      return invalids.length < 1
        ? { key: 'br-uniqueness-' + fieldName, valid: true }
        : {
            key: 'br-uniqueness-' + fieldName,
            valid: false,
            reason: formatConjunction(_(invalids).pluck('reason')),
          };
    });
  }

  private getUniqueInvalidReason(
    parentFieldInfo: Relationship | LiteralField,
    fieldInfo: RA<LiteralField | Relationship>
  ): string {
    if (fieldInfo.length > 1)
      return parentFieldInfo
        ? formsText.valuesOfMustBeUniqueToField({
            values: formatConjunction(fieldInfo.map((fld) => fld.label)),
            fieldName: parentFieldInfo.label,
          })
        : formsText.valuesOfMustBeUniqueToDatabase({
            values: formatConjunction(fieldInfo.map((fld) => fld.label)),
          });
    else
      return parentFieldInfo
        ? formsText.valueMustBeUniqueToField({
            fieldName: parentFieldInfo.label,
          })
        : formsText.valueMustBeUniqueToDatabase();
  }

  private uniqueIn(
    toOneField: string | undefined,
    fieldNames: RA<string> | string | null
  ): Promise<BusinessRuleResult> {
    if (fieldNames === null) {
      return Promise.resolve({
        valid: false,
        reason: formsText.valueMustBeUniqueToDatabase(),
      });
    }
    fieldNames = Array.isArray(fieldNames) ? fieldNames : [fieldNames];

    const fieldValues = fieldNames.map((value) => {
      return this.resource.get(value);
    });

    const fieldInfo = fieldNames.map((field) => {
      return this.resource.specifyModel.getField(field);
    });

    const fieldIsToOne = fieldInfo.map((field) => {
      return field?.type === 'many-to-one';
    });

    const fieldIds = fieldValues.map((value, index) => {
      if (fieldIsToOne[index] != null) {
        if (value == null || typeof value == 'undefined') {
          return null;
        } else {
          return typeof value === 'string' ? idFromUrl(value) : value.id;
        }
      } else return undefined;
    });

    const toOneFieldInfo =
      toOneField !== undefined
        ? (this.resource.specifyModel.getField(toOneField) as Relationship)
        : undefined;

    const allNullOrUndefinedToOnes = _.reduce(
      fieldIds,
      (result, value, index) => {
        return result && fieldIsToOne[index]
          ? _.isNull(fieldIds[index])
          : false;
      },
      true
    );

    const invalidResponse: BusinessRuleResult & {
      localDuplicates?: RA<SpecifyResource<SCHEMA>>;
    } = {
      valid: false,
      reason:
        toOneFieldInfo !== undefined && fieldInfo !== undefined
          ? this.getUniqueInvalidReason(toOneFieldInfo, fieldInfo)
          : '',
    };

    if (allNullOrUndefinedToOnes) return Promise.resolve({ valid: true });

    const hasSameValues = (other: SpecifyResource<SCHEMA>): boolean => {
      const hasSameValue = (
        fieldValue: string | number | null,
        fieldName: string,
        fieldIsToOne: boolean,
        fieldId: string
      ): boolean => {
        if (other.id != null && other.id === this.resource.id) return false;
        if (other.cid === this.resource.cid) return false;
        const otherValue = other.get(fieldName);
        if (
          fieldIsToOne &&
          typeof otherValue != 'undefined' &&
          typeof otherValue !== 'string'
        ) {
          return Number.parseInt(otherValue?.id) === Number.parseInt(fieldId);
        } else return fieldValue === otherValue;
      };

      return _.reduce(
        fieldValues,
        (result, fieldValue, index) => {
          return (
            result &&
            hasSameValue(
              fieldValue,
              fieldNames![index],
              fieldIsToOne[index],
              fieldIds[index]
            )
          );
        },
        true
      );
    };

    if (toOneField != null) {
      const hasLocalCollection =
        this.resource.collection &&
        this.resource.collection.related &&
        toOneFieldInfo?.relatedModel ===
          this.resource.collection.related?.specifyModel;

      var localCollection = hasLocalCollection
        ? this.resource.collection.models.filter((resource) => {
            return resource !== undefined;
          })
        : [];

      var duplicates = localCollection.filter((resource) => {
        return hasSameValues(resource);
      });

      if (duplicates.length > 0) {
        invalidResponse.localDuplicates = duplicates;
        return Promise.resolve(invalidResponse);
      }

      return this.resource
        .rget(toOneField)
        .then((related: SpecifyResource<AnySchema>) => {
          if (!related) return Promise.resolve({ valid: true });
          var filters = {};
          for (var f = 0; f < fieldNames!.length; f++) {
            filters[fieldNames![f]] = fieldIds[f] || fieldValues[f];
          }
          const others = new this.resource.specifyModel.ToOneCollection({
            related: related,
            field: toOneFieldInfo,
            filters: filters,
          });

          return others.fetch().then(() => {
            var inDatabase = others.chain().compact();
            inDatabase = hasLocalCollection
              ? inDatabase
                  .filter((other: SpecifyResource<SCHEMA>) => {
                    return !this.resource.collection.get(other.id);
                  })
                  .value()
              : inDatabase.value();

            if (
              inDatabase.some((other) => {
                return hasSameValues(other);
              })
            ) {
              return invalidResponse;
            } else {
              return { valid: true };
            }
          });
        });
    } else {
      var filters = {};

      for (var f = 0; f < fieldNames.length; f++) {
        filters[fieldNames[f]] = fieldIds[f] || fieldValues[f];
      }
      const others = new this.resource.specifyModel.LazyCollection({
        filters: filters,
      });
      return others.fetch().then(() => {
        if (
          others.models.some((other: SpecifyResource<SCHEMA>) => {
            return hasSameValues(other);
          })
        ) {
          return invalidResponse;
        } else {
          return { valid: true };
        }
      });
    }
  }

  private invokeRule(
    ruleName: keyof BusinessRuleDefs<SCHEMA>,
    fieldName: string | undefined,
    args: RA<any>
  ): Promise<BusinessRuleResult | undefined> {
    if (this.rules === undefined) {
      return Promise.resolve(undefined);
    }
    var rule = this.rules[ruleName];
    const isValid =
      (rule && typeof rule == 'function') ||
      (fieldName &&
        rule &&
        rule[fieldName] &&
        typeof rule[fieldName] == 'function');

    if (!isValid) return Promise.resolve(undefined);

    if (fieldName !== undefined) {
      rule = rule[fieldName];
      if (!rule) {
        return Promise.resolve({
          key: 'invalidRule',
          valid: false,
          reason: 'no rule: ' + ruleName + ' for: ' + fieldName,
        });
      }
    }
    if (rule == undefined) {
      return Promise.resolve({
        key: 'invalidRule',
        valid: false,
        reason: 'no rule: ' + ruleName + ' for: ' + fieldName,
      });
    }
    return Promise.resolve(rule.apply(this, args));
  }
}

export function attachBusinessRules(
  resource: SpecifyResource<AnySchema>
): void {
  const businessRuleManager = new BusinessRuleMgr(resource);
  overwriteReadOnly(resource, 'saveBlockers', new SaveBlockers(resource));
  overwriteReadOnly(resource, 'businessRuleMgr', businessRuleManager);
  businessRuleManager.setUpManager();
}

export type BusinessRuleResult = {
  readonly key?: string;
} & (
  | {
      readonly valid: true;
      readonly action?: () => void;
    }
  | { readonly valid: false; readonly reason: string }
);

const resolveFlippedPromise = (
  promise: Promise<any>,
  ...args: RA<any>
): void => {
  globalThis.setTimeout(() => promise.resolve(...args), 0);
};
