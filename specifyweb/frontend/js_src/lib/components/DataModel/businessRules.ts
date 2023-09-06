import { formsText } from '../../localization/forms';
import type { ResolvablePromise } from '../../utils/promise';
import { flippedPromise } from '../../utils/promise';
import type { IR, RA } from '../../utils/types';
import { filterArray, overwriteReadOnly } from '../../utils/types';
import { formatConjunction } from '../Atoms/Internationalization';
import { isTreeResource } from '../InitialContext/treeRanks';
import type { BusinessRuleDefs } from './businessRuleDefs';
import { businessRuleDefs } from './businessRuleDefs';
import type {
  AnySchema,
  AnyTree,
  CommonFields,
  TableFields,
} from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { idFromUrl } from './resource';
import { SaveBlockers } from './saveBlockers';
import type { LiteralField, Relationship } from './specifyField';
import type { Collection } from './specifyModel';
import { initializeTreeRecord, treeBusinessRules } from './treeBusinessRules';
import type { CollectionObjectAttachment, Collector } from './types';

export class BusinessRuleManager<SCHEMA extends AnySchema> {
  private readonly resource: SpecifyResource<SCHEMA>;

  private readonly rules: BusinessRuleDefs<AnySchema | SCHEMA> | undefined;

  /* eslint-disable-next-line functional/prefer-readonly-type */
  public pendingPromise: Promise<BusinessRuleResult | undefined> =
    Promise.resolve(undefined);

  /* eslint-disable-next-line functional/prefer-readonly-type */
  private fieldChangePromises: Record<string, ResolvablePromise<string>> = {};

  public constructor(resource: SpecifyResource<SCHEMA>) {
    this.resource = resource;
    this.rules = businessRuleDefs[this.resource.specifyModel.name];
  }

  private addPromise(
    promise: Promise<BusinessRuleResult | string | undefined>
  ): void {
    this.pendingPromise = Promise.allSettled([
      this.pendingPromise,
      promise,
    ]).then(() => undefined);
  }

  private changed(resource: SpecifyResource<SCHEMA>): void {
    if (resource.isBeingInitialized && typeof resource.changed === 'object') {
      Object.keys(resource.changed).forEach((field) => {
        this.checkField(field);
      });
    }
  }

  private added(
    resource: SpecifyResource<SCHEMA>,
    collection: Collection<SCHEMA>
  ) {
    /**
     * REFACTOR: remove the need for this and the orderNumber check by
     * implementing a general solution on the backend
     */
    if (resource.specifyModel.getField('ordinal') !== undefined)
      (resource as SpecifyResource<CollectionObjectAttachment>).set(
        'ordinal',
        collection.indexOf(resource),
        { silent: true }
      );

    if (resource.specifyModel.getField('orderNumber') !== undefined)
      (resource as SpecifyResource<Collector>).set(
        'orderNumber',
        collection.indexOf(resource),
        { silent: true }
      );
    this.addPromise(
      this.invokeRule('onAdded', undefined, [resource, collection])
    );
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
    this.resource.on('add', this.added, this);
    this.resource.on('remove', this.removed, this);
  }

  public async checkField(
    fieldName: keyof SCHEMA['fields']
  ): Promise<RA<BusinessRuleResult<SCHEMA>>> {
    fieldName =
      typeof fieldName === 'string' ? fieldName.toLowerCase() : fieldName;
    const thisCheck: ResolvablePromise<string> = flippedPromise();
    this.addPromise(thisCheck);

    if (this.fieldChangePromises[fieldName as string] !== undefined)
      this.fieldChangePromises[fieldName as string].resolve('superseded');
    this.fieldChangePromises[fieldName as string] = thisCheck;

    const checks: RA<Promise<BusinessRuleResult<SCHEMA> | undefined>> = [
      this.invokeRule('fieldChecks', fieldName, [this.resource]),
      this.checkUnique(fieldName),
      isTreeResource(this.resource as SpecifyResource<AnySchema>)
        ? treeBusinessRules(
            this.resource as SpecifyResource<AnyTree>,
            fieldName as string
          )
        : Promise.resolve({ valid: true }),
    ];

    return Promise.all(checks).then((results) =>
      thisCheck === this.fieldChangePromises[fieldName as string]
        ? this.processCheckFieldResults(fieldName, results)
        : [{ valid: true }]
    );
  }

  private processCheckFieldResults(
    fieldName: keyof SCHEMA['fields'],
    results: RA<BusinessRuleResult<SCHEMA> | undefined>
  ): RA<BusinessRuleResult<SCHEMA>> {
    return filterArray(
      results.map((result) => {
        if (result === undefined) return undefined;

        if (result.valid && typeof result.action === 'function')
          result.action();

        if (typeof result.key === 'string' && !result.valid) {
          this.resource.saveBlockers!.add(
            result.key,
            fieldName as string,
            result.reason
          );
        }

        if (typeof result.key === 'string' && result.valid) {
          this.resource.saveBlockers!.remove(result.key);
        }

        return result;
      })
    );
  }

  private async checkUnique(
    fieldName: keyof SCHEMA['fields']
  ): Promise<BusinessRuleResult<SCHEMA>> {
    const scopeFields =
      this.rules?.uniqueIn === undefined
        ? []
        : this.rules?.uniqueIn[
            this.resource.specifyModel.getField(fieldName as string)
              ?.name as TableFields<SCHEMA>
          ] ?? [];
    const results: RA<Promise<BusinessRuleResult<SCHEMA>>> = scopeFields.map(
      async (uniqueRule) => {
        let scope = uniqueRule;
        let fieldNames: readonly string[] | undefined = [fieldName as string];
        if (uniqueRule !== undefined && typeof uniqueRule !== 'string') {
          fieldNames = fieldNames.concat(uniqueRule.otherFields);
          scope = uniqueRule.field;
        }
        return this.uniqueIn(
          (scope as string | undefined)?.toLowerCase(),
          fieldNames
        );
      }
    );
    return Promise.all(results).then((results) => {
      const invalids = results.filter((result) => !result.valid);
      return invalids.length === 0
        ? { key: `br-uniqueness-${fieldName as string}`, valid: true }
        : {
            key: `br-uniqueness-${fieldName as string}`,
            valid: false,
            reason: formatConjunction(
              invalids.map(
                (invalid) =>
                  invalid['reason' as keyof BusinessRuleResult] as string
              )
            ),
          };
    });
  }

  private getUniqueInvalidReason(
    scopeField: LiteralField | Relationship | undefined,
    field: RA<LiteralField | Relationship>
  ): string {
    if (field.length > 1)
      return scopeField
        ? formsText.valuesOfMustBeUniqueToField({
            values: formatConjunction(field.map((fld) => fld.label)),
            fieldName: scopeField.label,
          })
        : formsText.valuesOfMustBeUniqueToDatabase({
            values: formatConjunction(field.map((fld) => fld.label)),
          });
    else
      return scopeField
        ? formsText.valueMustBeUniqueToField({
            fieldName: scopeField.label,
          })
        : formsText.valueMustBeUniqueToDatabase();
  }

  private async uniqueIn(
    scope: string | undefined,
    fieldNames: RA<string> | string | undefined
  ): Promise<BusinessRuleResult<SCHEMA>> {
    if (fieldNames === undefined) {
      return {
        valid: false,
        reason: formsText.valueMustBeUniqueToDatabase(),
      };
    }
    fieldNames = Array.isArray(fieldNames) ? fieldNames : [fieldNames];

    const fieldValues = fieldNames.map((value) => this.resource.get(value));

    const fieldInfo = fieldNames.map(
      (field) => this.resource.specifyModel.getField(field)!
    );

    const fieldIsToOne = fieldInfo.map(
      (field) => field?.type === 'many-to-one'
    );

    const fieldIds = fieldValues.map((value, index) => {
      if (
        fieldIsToOne[index] !== undefined &&
        value !== undefined &&
        value !== null
      ) {
        return idFromUrl(value);
      }
      return undefined;
    });

    const scopeFieldInfo =
      scope !== null && scope !== undefined
        ? (this.resource.specifyModel.getField(scope) as Relationship)
        : undefined;

    const allNullOrUndefinedToOnes = fieldIds.reduce(
      (previous, _current, index) =>
        previous && fieldIsToOne[index] ? fieldIds[index] === null : false,
      true
    );

    const invalidResponse: BusinessRuleResult<SCHEMA> = {
      valid: false,
      /* eslint-disable-next-line array-func/prefer-includes */
      reason: fieldInfo.some((field) => field === undefined)
        ? ''
        : this.getUniqueInvalidReason(scopeFieldInfo, fieldInfo),
    };

    if (allNullOrUndefinedToOnes) return { valid: true };

    const hasSameValues = (other: SpecifyResource<SCHEMA>): boolean => {
      const hasSameValue = (
        fieldValue: number | string | null,
        fieldName: string
      ): boolean => {
        if (other.id != null && other.id === this.resource.id) return false;
        if (other.cid === this.resource.cid) return false;
        const otherValue = other.get(fieldName);

        return fieldValue === otherValue;
      };

      return fieldValues.reduce(
        (previous, current, index) =>
          previous && hasSameValue(current, fieldNames![index]),
        true
      );
    };

    if (scope === undefined) {
      const filters: Partial<IR<boolean | number | string | null>> = {};

      for (const [f, fieldName] of fieldNames.entries()) {
        filters[fieldName] = fieldIds[f] || fieldValues[f];
      }
      const others = new this.resource.specifyModel.LazyCollection({
        filters: filters as Partial<
          CommonFields &
            IR<boolean | number | string | null> &
            SCHEMA['fields'] & {
              readonly orderby: string;
              readonly domainfilter: boolean;
            }
        >,
      });
      return others
        .fetch()
        .then((fetchedCollection) =>
          fetchedCollection.models.some((other: SpecifyResource<SCHEMA>) =>
            hasSameValues(other)
          )
            ? invalidResponse
            : { valid: true }
        );
    } else {
      const localCollection = this.resource.collection ?? { models: [] };

      if (
        typeof localCollection.field?.name === 'string' &&
        localCollection.field.name.toLowerCase() !== scope
      )
        return { valid: true };

      const localResources = filterArray(localCollection.models);

      const duplicates = localResources.filter((resource) =>
        hasSameValues(resource)
      );

      if (duplicates.length > 0) {
        overwriteReadOnly(invalidResponse, 'localDuplicates', duplicates);
        return invalidResponse;
      }

      const relatedPromise: Promise<SpecifyResource<AnySchema>> =
        this.resource.getRelated(scope);

      return relatedPromise.then(async (related) => {
        if (!related) return { valid: true };
        const filters: Partial<IR<boolean | number | string | null>> = {};
        for (let f = 0; f < fieldNames!.length; f++) {
          filters[fieldNames![f]] = fieldIds[f] || fieldValues[f];
        }
        const others = new this.resource.specifyModel.ToOneCollection({
          related,
          field: scopeFieldInfo,
          filters: filters as Partial<
            CommonFields &
              IR<boolean | number | string | null> &
              SCHEMA['fields'] & {
                readonly orderby: string;
                readonly domainfilter: boolean;
              }
          >,
        });

        return others.fetch().then((fetchedCollection) => {
          const inDatabase = fetchedCollection.models.filter(
            (otherResource) => otherResource !== undefined
          );

          return inDatabase.some((other) => hasSameValues(other))
            ? invalidResponse
            : { valid: true };
        });
      });
    }
  }

  private async invokeRule(
    ruleName: keyof BusinessRuleDefs<SCHEMA>,
    fieldName: keyof SCHEMA['fields'] | undefined,
    args: RA<unknown>
  ): Promise<BusinessRuleResult | undefined> {
    if (this.rules === undefined || ruleName === 'uniqueIn') {
      return undefined;
    }
    let rule = this.rules[ruleName];

    if (
      rule !== undefined &&
      ruleName === 'fieldChecks' &&
      fieldName !== undefined
    )
      rule =
        rule[
          this.resource.specifyModel.getField(fieldName as string)
            ?.name as keyof typeof rule
        ];

    if (rule === undefined) return undefined;

    /*
     * For some reason, Typescript still thinks that this.rules["fieldChecks"] is a valid rule
     * thus rule.apply() would be invalid
     *  However, rule will never be this.rules["fieldChecks"]
     */
    // @ts-expect-error
    return rule.apply(undefined, args);
  }
}

export function attachBusinessRules(resource: SpecifyResource<AnySchema>) {
  const businessRuleManager = new BusinessRuleManager(resource);
  overwriteReadOnly(resource, 'saveBlockers', new SaveBlockers(resource));
  overwriteReadOnly(resource, 'businessRuleManager', businessRuleManager);
  businessRuleManager.setUpManager();
}

export type BusinessRuleResult<SCHEMA extends AnySchema = AnySchema> = {
  readonly key?: string;
  readonly localDuplicates?: RA<SpecifyResource<SCHEMA>>;
} & (
  | {
      readonly valid: true;
      readonly action?: () => void;
    }
  | { readonly valid: false; readonly reason: string }
);
