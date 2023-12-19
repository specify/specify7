import type { LocalizedString } from 'typesafe-i18n';

import type { ResolvablePromise } from '../../utils/promise';
import { flippedPromise } from '../../utils/promise';
import type { IR, RA } from '../../utils/types';
import { filterArray, overwriteReadOnly } from '../../utils/types';
import { removeKey } from '../../utils/utils';
import { formatConjunction } from '../Atoms/Internationalization';
import { isTreeResource } from '../InitialContext/treeRanks';
import type { BusinessRuleDefs } from './businessRuleDefs';
import { businessRuleDefs } from './businessRuleDefs';
import type { AnySchema, AnyTree, CommonFields } from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { idFromUrl } from './resource';
import { SaveBlockers } from './saveBlockers';
import type { LiteralField, Relationship } from './specifyField';
import type { Collection } from './specifyModel';
import { initializeTreeRecord, treeBusinessRules } from './treeBusinessRules';
import type { CollectionObjectAttachment, Tables } from './types';
import { getUniqueInvalidReason, getUniquenessRules } from './uniquenessRules';

/* eslint-disable functional/no-this-expression */
// eslint-disable-next-line functional/no-class
export class BusinessRuleManager<SCHEMA extends AnySchema> {
  // eslint-disable-next-line functional/prefer-readonly-type
  public pendingPromise: Promise<BusinessRuleResult | undefined> =
    Promise.resolve(undefined);

  private readonly resource: SpecifyResource<SCHEMA>;

  private readonly rules: BusinessRuleDefs<AnySchema | SCHEMA> | undefined;

  // eslint-disable-next-line functional/prefer-readonly-type
  private fieldChangePromises: Record<string, ResolvablePromise<string>> = {};

  // eslint-disable-next-line functional/prefer-readonly-type
  private watchers: Record<string, () => void> = {};

  public constructor(resource: SpecifyResource<SCHEMA>) {
    this.resource = resource;
    this.rules = businessRuleDefs[this.resource.specifyModel.name];
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
    const processedFieldName = fieldName.toString().toLowerCase();
    const thisCheck: ResolvablePromise<string> = flippedPromise();
    this.addPromise(thisCheck);

    if (this.fieldChangePromises[processedFieldName] !== undefined)
      this.fieldChangePromises[processedFieldName].resolve('superseded');
    this.fieldChangePromises[processedFieldName] = thisCheck;

    const checks: RA<Promise<BusinessRuleResult<SCHEMA> | undefined>> = [
      this.invokeRule('fieldChecks', processedFieldName, [this.resource]),
      this.checkUnique(processedFieldName),
      isTreeResource(this.resource as SpecifyResource<AnySchema>)
        ? treeBusinessRules(
            this.resource as SpecifyResource<AnyTree>,
            processedFieldName
          )
        : Promise.resolve({ valid: true }),
    ];

    return Promise.all(checks).then((results) => {
      /*
       * TEST: Check if the variable is necessary. The legacy js code called processCheckFieldResults first before resolving.
       *       Using the variable to maintain same functionality, as processCheckFieldResults might have side-effects,
       *       especially since pendingPromise is public. Assuming that legacy code had no related bugs to this.
       */
      const resolvedResult: RA<BusinessRuleResult<SCHEMA>> =
        thisCheck === this.fieldChangePromises[processedFieldName]
          ? this.processCheckFieldResults(processedFieldName, results)
          : [{ valid: true }];
      thisCheck.resolve('finished');
      return resolvedResult;
    });
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
      this.addPromise(
        Promise.all(
          Object.keys(resource.changed).map(async (field) =>
            this.checkField(field)
          )
        ).then(() => undefined)
      );
    }
  }

  private added(
    resource: SpecifyResource<SCHEMA>,
    collection: Collection<SCHEMA>
  ): void {
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
    const rules =
      getUniquenessRules(
        this.resource.specifyModel.name.toLowerCase() as keyof Tables
      ) ?? [];
    const rulesToCheck = rules.filter((rule) =>
      rule.fields.some(
        ({ name }) => name.toLowerCase() === fieldName.toLowerCase()
      )
    );

    const results = rulesToCheck.map(async (rule) =>
      this.uniqueIn(
        rule.scopes.map(({ name }) => name),
        rule.fields.map(({ name }) => name)
      )
    );
    void Promise.all(results).then((results) =>
      results
        .flatMap((result: BusinessRuleResult<SCHEMA>) => result.localDuplicates)
        .filter((result) => result !== undefined)
        .forEach((duplicate: SpecifyResource<SCHEMA> | undefined) => {
          if (duplicate === undefined) return;
          const event = `${duplicate.cid}:${fieldName}`;
          if (this.watchers[event] === undefined) {
            this.watchers[event] = (): void =>
              duplicate.on(
                `change:${fieldName}`,
                () => void this.checkField(fieldName)
              );
            duplicate.once('remove', () => {
              this.watchers = removeKey(this.watchers, event);
            });
          }
        })
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

  private async uniqueIn(
    scopes: RA<string>,
    fieldNames: RA<string>
  ): Promise<BusinessRuleResult<SCHEMA>> {
    const fieldValues = fieldNames.map((value) => this.resource.get(value));

    const fieldInfo = fieldNames.map((field) =>
      this.resource.specifyModel.getField(field)
    );

    const fieldIsToOne = fieldInfo.map(
      (field) => field?.type === 'many-to-one'
    );

    const fieldIds = fieldValues.map((value, index) =>
      fieldIsToOne[index] !== undefined && value !== undefined && value !== null
        ? idFromUrl(value)
        : undefined
    );

    const scopeFieldInfo = scopes.map((field) =>
      this.resource.specifyModel.getRelationship(field)
    );

    const allNullOrUndefinedToOnes = fieldIds.reduce(
      (previous, _current, index) =>
        previous && fieldIsToOne[index] ? fieldIds[index] === null : false,
      true
    );

    const invalidResponse: BusinessRuleResult<SCHEMA> = {
      valid: false,
      reason: getUniqueInvalidReason(
        filterArray(scopeFieldInfo),
        filterArray(fieldInfo)
      ),
    };

    if (allNullOrUndefinedToOnes) return { valid: true };

    const hasSameValues = (other: SpecifyResource<SCHEMA>): boolean => {
      const hasSameValue = (
        fieldValue: number | string | null,
        fieldName: string
      ): boolean => {
        if (
          other.id !== null &&
          other.id !== undefined &&
          other.id === this.resource.id
        )
          return false;
        if (other.cid === this.resource.cid) return false;
        const otherValue = other.get(fieldName);

        return fieldValue === otherValue;
      };

      return fieldValues.reduce(
        (previous, current, index) =>
          previous && hasSameValue(current, fieldNames[index]),
        true
      );
    };

    // If the uniqueness rule should be unique to database
    if (scopes.length === 0) {
      const filters = Object.fromEntries(
        fieldNames.map((fieldName, index) => [
          fieldName,
          fieldIds[index] ?? fieldValues[index],
        ])
      ) as Partial<
        CommonFields &
          IR<boolean | number | string | null> &
          SCHEMA['fields'] & {
            readonly orderby: string;
            readonly domainfilter: boolean;
          }
      >;
      const others = new this.resource.specifyModel.LazyCollection({
        filters,
      });
      return others
        .fetch()
        .then((fetchedCollection) =>
          fetchedCollection.models.some(hasSameValues)
            ? invalidResponse
            : { valid: true }
        );
    } else {
      const localCollection = this.resource.collection ?? { models: [] };

      if (
        typeof localCollection.field?.name === 'string' &&
        !scopes.includes(localCollection.field.name.toLowerCase())
      )
        return { valid: true };

      const localResources = filterArray(localCollection.models);

      const duplicates = localResources.filter(hasSameValues);

      if (duplicates.length > 0) {
        overwriteReadOnly(invalidResponse, 'localDuplicates', duplicates);
        return invalidResponse;
      }

      const relatedPromise: Promise<RA<SpecifyResource<AnySchema>>> =
        Promise.all(
          scopes.map(async (scope) => this.resource.getRelated(scope))
        );

      return relatedPromise
        .then(async (scopeResources) =>
          Promise.all(
            scopeResources.map(async (scopeResource, index) => {
              const filters = Object.fromEntries(
                fieldNames.map((fieldName, index) => [
                  fieldName,
                  fieldIds[index] ?? fieldValues[index],
                ])
              ) as Partial<
                CommonFields &
                  IR<boolean | number | string | null> &
                  SCHEMA['fields'] & {
                    readonly orderby: string;
                    readonly domainfilter: boolean;
                  }
              >;
              return new this.resource.specifyModel.ToOneCollection({
                related: scopeResource,
                field: scopeFieldInfo[index],
                filters,
              }).fetch();
            })
          )
        )
        .then((fetchedCollections) =>
          fetchedCollections
            .flatMap((fetchedCollection) =>
              filterArray(fetchedCollection.models).map(hasSameValues)
            )
            .includes(true)
            ? invalidResponse
            : { valid: true }
        );
    }
  }

  private async invokeRule(
    ruleName: keyof BusinessRuleDefs<SCHEMA>,
    fieldName: keyof SCHEMA['fields'] | undefined,
    args: RA<unknown>
  ): Promise<BusinessRuleResult | undefined> {
    if (this.rules === undefined) {
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
    return rule(...args);
  }
}
/* eslint-enable functional/no-this-expression */

export function attachBusinessRules(
  resource: SpecifyResource<AnySchema>
): void {
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
