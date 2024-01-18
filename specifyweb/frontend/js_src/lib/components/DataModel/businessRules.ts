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
import { backboneFieldSeparator, djangoLookupSeparator } from './helpers';
import type { AnySchema, AnyTree, CommonFields } from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { getResourceApiUrl } from './resource';
import { setSaveBlockers } from './saveBlockers';
import { specialFields } from './serializers';
import type { LiteralField, Relationship } from './specifyField';
import type { Collection, SpecifyTable } from './specifyTable';
import { initializeTreeRecord, treeBusinessRules } from './treeBusinessRules';
import type { CollectionObjectAttachment } from './types';
import type { UniquenessRule } from './uniquenessRules';
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
    this.rules = businessRuleDefs[this.resource.specifyTable.name];
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
        : Promise.resolve({ isValid: true }),
    ];

    return Promise.all(checks).then((results) => {
      /*
       * TEST: Check if the variable is necessary. The legacy js code called processCheckFieldResults first before resolving.
       *       Using the variable to maintain same functionality, as processCheckFieldResults might have side-effects,
       *       especially since pendingPromise is public. Assuming that legacy code had no related bugs to this.
       */
      const resolvedResult: RA<BusinessRuleResult<SCHEMA>> =
        thisCheck === this.fieldChangePromises[processedFieldName]
          ? this.processCheckFieldResults(
              processedFieldName,
              filterArray(results)
            )
          : [{ isValid: true }];
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
    if (
      !resource.isBeingInitialized() &&
      typeof resource.changed === 'object'
    ) {
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
    if (resource.specifyTable.getField('ordinal') !== undefined)
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
    fieldName: string & keyof SCHEMA['fields'],
    results: RA<BusinessRuleResult<SCHEMA>>
  ): RA<BusinessRuleResult<SCHEMA>> {
    if (!specialFields.has(fieldName)) {
      const field = this.resource.specifyTable.strictGetField(fieldName);
      const saveBlockerMessages = filterArray(
        results.map((result) => (result.isValid ? undefined : result.reason))
      );
      setSaveBlockers(this.resource, field, saveBlockerMessages);
    }

    results.forEach((result) => {
      if (result.isValid) result.action?.();
    });

    return results;
  }

  private async checkUnique(
    fieldName: string & keyof SCHEMA['fields']
  ): Promise<BusinessRuleResult<SCHEMA>> {
    const rules = getUniquenessRules(this.resource.specifyTable.name) ?? [];
    const rulesToCheck = rules.filter(({ rule }) =>
      rule.fields.some(
        (ruleFieldName) =>
          ruleFieldName.toLowerCase() === fieldName.toLowerCase()
      )
    );

    const results = rulesToCheck.map(async ({ rule }) => this.uniqueIn(rule));
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
      const invalids = results.filter((result) => !result.isValid);
      return invalids.length === 0
        ? { isValid: true }
        : {
            isValid: false,
            reason: formatConjunction(
              invalids.map(
                (invalid) =>
                  invalid[
                    'reason' as keyof BusinessRuleResult
                  ] as unknown as LocalizedString
              )
            ),
          };
    });
  }

  private async uniqueIn(
    rule: UniquenessRule
  ): Promise<BusinessRuleResult<SCHEMA>> {
    const invalidResponse: BusinessRuleResult<SCHEMA> = {
      isValid: false,
      reason: getUniqueInvalidReason(
        rule.scopes.map(
          (scope) =>
            getFieldsFromPath(this.resource.specifyTable, scope).at(
              -1
            ) as Relationship
        ),
        rule.fields.map((field) =>
          this.resource.specifyTable.strictGetField(field)
        )
      ),
    };

    const hasSameValues = (
      other: SpecifyResource<SCHEMA>,
      fieldValues: IR<number | string | null | undefined>
    ): boolean => {
      if (other.id != null && other.id === this.resource.id) return false;
      if (other.cid === this.resource.cid) return false;

      return Object.entries(fieldValues).reduce(
        (result, [fieldName, value]) => {
          const field = other.specifyTable.getField(fieldName);
          const adjustedValue =
            field?.isRelationship &&
            typeof value === 'number' &&
            field.type === 'many-to-one'
              ? getResourceApiUrl(field.relatedTable.name, value)
              : value;
          return result && adjustedValue === other.get(fieldName);
        },
        true
      );
    };

    const filters = Object.fromEntries(
      await Promise.all(
        [...rule.fields, ...rule.scopes].map(async (field) => {
          const related: SpecifyResource<AnySchema> | number | string | null =
            await this.resource.getRelated(
              field.replaceAll(djangoLookupSeparator, backboneFieldSeparator)
            );
          return [field, related.id === undefined ? related : related.id];
        })
      )
    ) as unknown as Partial<
      CommonFields &
        Readonly<Record<string, boolean | number | string | null>> &
        SCHEMA['fields'] & {
          readonly orderby: string;
        }
    >;

    if (
      Object.entries(filters).some(([_field, value]) => value === undefined)
    ) {
      const localCollection = this.resource.collection ?? { models: [] };
      const duplicates = localCollection.models.filter((other) =>
        hasSameValues(other, filters as IR<number | string | null | undefined>)
      );
      if (duplicates.length > 0) {
        overwriteReadOnly(invalidResponse, 'localDuplicates', duplicates);
        return invalidResponse;
      } else return { isValid: true };
    }

    return new this.resource.specifyTable.LazyCollection({
      filters,
    })
      .fetch()
      .then((fetchedCollection) =>
        fetchedCollection.models.length > 0
          ? invalidResponse
          : { isValid: true }
      );
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
    return rule(...args);
  }
}
/* eslint-enable functional/no-this-expression */

export function getFieldsFromPath(
  table: SpecifyTable,
  fieldPath: string
): RA<LiteralField | Relationship> {
  const fields = fieldPath.split(djangoLookupSeparator);

  let currentTable = table;
  return fields.map((fieldName) => {
    const field = currentTable.strictGetField(fieldName);
    if (field.isRelationship) {
      currentTable = field.relatedTable;
    }
    return field;
  });
}

export function attachBusinessRules(
  resource: SpecifyResource<AnySchema>
): void {
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
