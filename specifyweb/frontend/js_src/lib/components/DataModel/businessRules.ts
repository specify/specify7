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
import { setSaveBlockers } from './saveBlockers';
import { specialFields } from './serializers';
import type { LiteralField, Relationship } from './specifyField';
import type { Collection } from './specifyTable';
import { initializeTreeRecord, treeBusinessRules } from './treeBusinessRules';

export class BusinessRuleManager<SCHEMA extends AnySchema> {
  private readonly resource: SpecifyResource<SCHEMA>;

  private readonly rules: BusinessRuleDefs<AnySchema | SCHEMA> | undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  public pendingPromises: Promise<BusinessRuleResult | undefined> =
    Promise.resolve(undefined);

  private readonly fieldChangePromises: Record<
    string,
    ResolvablePromise<string>
  > = {};

  private readonly watchers: Record<string, () => void> = {};

  public constructor(resource: SpecifyResource<SCHEMA>) {
    this.resource = resource;
    this.rules = businessRuleDefs[this.resource.specifyTable.name];
  }

  private addPromise(
    promise: Promise<BusinessRuleResult | string | undefined>
  ): void {
    this.pendingPromises = Promise.allSettled([
      this.pendingPromises,
      promise,
    ]).then(() => undefined);
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

  public checkField(fieldName: string & keyof SCHEMA['fields']) {
    fieldName =
      typeof fieldName === 'string' ? fieldName.toLowerCase() : fieldName;
    const thisCheck: ResolvablePromise<string> = flippedPromise();
    this.addPromise(thisCheck);

    this.fieldChangePromises[fieldName] !== undefined &&
      this.fieldChangePromises[fieldName].resolve('superseded');
    this.fieldChangePromises[fieldName] = thisCheck;

    const checks = [
      this.invokeRule('fieldChecks', fieldName, [this.resource]),
      this.checkUnique(fieldName),
    ];

    if (isTreeResource(this.resource as SpecifyResource<AnySchema>))
      checks.push(
        treeBusinessRules(this.resource as SpecifyResource<AnyTree>, fieldName)
      );

    Promise.all(checks)
      .then((results) =>
        thisCheck === this.fieldChangePromises[fieldName]
          ? this.processCheckFieldResults(fieldName, filterArray(results))
          : undefined
      )
      .then(() => thisCheck.resolve('finished'));
  }

  private processCheckFieldResults(
    fieldName: string & keyof SCHEMA['fields'],
    results: RA<BusinessRuleResult<SCHEMA>>
  ) {
    if (specialFields.has(fieldName)) return;
    const field = this.resource.specifyTable.strictGetField(fieldName);
    results.forEach((result) => {
      setSaveBlockers(
        this.resource,
        field,
        result.isValid ? [] : [result.reason]
      );
      if (result.isValid) result.action?.();
    });
  }

  private async checkUnique(
    fieldName: keyof SCHEMA['fields']
  ): Promise<BusinessRuleResult> {
    const scopeFields =
      this.rules?.uniqueIn === undefined
        ? []
        : this.rules?.uniqueIn[
            this.resource.specifyTable.getField(fieldName as string)
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
        return this.uniqueIn(scope as string, fieldNames);
      }
    );

    Promise.all(results).then((results) => {
      results
        .flatMap((result: BusinessRuleResult<SCHEMA>) => result.localDuplicates)
        .filter((result) => result !== undefined)
        .forEach((duplicate: SpecifyResource<SCHEMA> | undefined) => {
          if (duplicate === undefined) return;
          const event = `${duplicate.cid}:${fieldName as string}`;
          if (!this.watchers[event]) {
            this.watchers[event] = () =>
              duplicate.on('change remove', () => this.checkField(fieldName));
          }
        });
    });
    return Promise.all(results).then((results) => {
      const invalids = results.filter((result) => !result.isValid);
      return invalids.length === 0
        ? { isValid: true }
        : {
            isValid: false,
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
        isValid: false,
        reason: formsText.valueMustBeUniqueToDatabase(),
      };
    }
    fieldNames = Array.isArray(fieldNames) ? fieldNames : [fieldNames];

    const fieldValues = fieldNames.map((value) => this.resource.get(value));

    const fieldInfo = fieldNames.map(
      (field) => this.resource.specifyTable.getField(field)!
    );

    const fieldIsToOne = fieldInfo.map(
      (field) => field?.type === 'many-to-one'
    );

    const fieldIds = fieldValues.map((value, index) =>
      fieldIsToOne[index] === undefined
        ? undefined
        : value === null
        ? undefined
        : idFromUrl(value)
    );

    const scopeFieldInfo =
      scope !== null && scope !== undefined
        ? (this.resource.specifyTable.getField(scope) as Relationship)
        : undefined;

    const allNullOrUndefinedToOnes = fieldIds.reduce(
      (previous, _current, index) =>
        previous && fieldIsToOne[index] ? fieldIds[index] === null : false,
      true
    );

    const invalidResponse: BusinessRuleResult<SCHEMA> = {
      isValid: false,
      reason: fieldInfo.includes(undefined)
        ? ''
        : this.getUniqueInvalidReason(scopeFieldInfo, fieldInfo),
    };

    if (allNullOrUndefinedToOnes) return { isValid: true };

    const hasSameValues = (other: SpecifyResource<SCHEMA>): boolean => {
      const hasSameValue = (
        fieldValue: number | string | null,
        fieldName: string
      ): boolean => {
        if (other.id !== undefined && other.id === this.resource.id)
          return false;
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

    // If the uniqueness rule should be unique to database
    if (scope === undefined) {
      const filters: Partial<IR<boolean | number | string | null>> = {};

      for (const [f, fieldName] of fieldNames.entries()) {
        filters[fieldName] = fieldIds[f] || fieldValues[f];
      }
      const others = new this.resource.specifyTable.LazyCollection({
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
            : { isValid: true }
        );
    } else {
      const localCollection =
        this.resource.collection?.models?.filter(
          (resource) => resource !== undefined
        ) ?? [];

      const duplicates = localCollection.filter((resource) =>
        hasSameValues(resource)
      );

      if (duplicates.length > 0) {
        overwriteReadOnly(invalidResponse, 'localDuplicates', duplicates);
        return invalidResponse;
      }

      const relatedPromise: Promise<SpecifyResource<AnySchema>> =
        this.resource.rgetPromise(scope);

      return relatedPromise.then(async (related) => {
        if (!related) return { isValid: true };
        const filters: Partial<IR<boolean | number | string | null>> = {};
        for (let f = 0; f < fieldNames!.length; f++) {
          filters[fieldNames![f]] = fieldIds[f] || fieldValues[f];
        }
        const others = new this.resource.specifyTable.ToOneCollection({
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
            : { isValid: true };
        });
      });
    }
  }

  private async invokeRule(
    ruleName: keyof BusinessRuleDefs<SCHEMA>,
    fieldName: keyof SCHEMA['fields'] | undefined,
    args: RA<any>
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
          this.resource.specifyTable.getField(fieldName as string)
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
  overwriteReadOnly(resource, 'businessRuleManager', businessRuleManager);
  businessRuleManager.setUpManager();
}

export type BusinessRuleResult<SCHEMA extends AnySchema = AnySchema> = {
  readonly localDuplicates?: RA<SpecifyResource<SCHEMA>>;
} & (
  | {
      readonly isValid: true;
      readonly action?: () => void;
    }
  | { readonly isValid: false; readonly reason: string }
);
