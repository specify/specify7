import { f } from '../../utils/functools';
import { filterArray, RR } from '../../utils/types';
import { Tables } from '../DataModel/types';
import { Relationship } from '../DataModel/specifyField';
import { schema } from '../DataModel/schema';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { softFail } from '../Errors/Crash';
import { error } from '../Errors/assert';

/**
 * If a resource is dependent on a table not in this list, instead of showing
 * the resource, show any of the related important tables.
 *
 * For example, if Agent is used in a AccessionAgent, instead of showing
 * AccessionAgent, show Accession
 */
export const parentTableRelationship = f.store<RR<keyof Tables, Relationship>>(
  () =>
    Object.fromEntries(
      filterArray(
        Object.entries(schema.models).map(([name, table]) => {
          if (name in overrides) {
            const override = overrides[name];
            return override === undefined
              ? undefined
              : [name, table.strictGetRelationship(override)];
          }
          /*
           * i.e, for AccessionAgent, strip the "Agent" part and check if there
           * is a table by the resulting name (i.e., Accession)
           */
          const potentialParentTable = name
            .replace(/([a-z])([A-Z])/gu, '$1 $2')
            .split(' ')
            .slice(0, -1)
            .join('');
          const relationships = table.relationships.filter(
            (relationship) =>
              relationship.relatedModel.name === potentialParentTable &&
              // For some weird reason, some relationships to parent tables are -to-many. Ignore them
              !relationshipIsToMany(relationship) &&
              relationship.name !== 'createdByAgent' &&
              relationship.name !== 'modifiedByAgent'
          );
          if (relationships.length > 1)
            softFail(
              error('Expected at most one parent relationship', {
                relationships,
                potentialParentTable,
              })
            );
          const relationship = relationships.at(0);
          if (relationship === undefined || relationshipIsToMany(relationship))
            return undefined;
          return [name, relationship];
        })
      )
    )
);
/**
 * Some exceptions are required for the above algorithm
 */
const overrides: {
  readonly [TABLE_NAME in keyof Tables]?:
    | undefined
    | keyof Tables[TABLE_NAME]['toOneIndependent'];
} = {
  BorrowReturnMaterial: 'borrowMaterial',
  CollectionObject: undefined,
  CollectionRelationship: undefined,
  Collector: 'collectingEvent',
  Determiner: 'determination',
  FieldNotebookPage: 'pageSet',
  LatLonPolygon: 'locality',
  LoanReturnPreparation: 'loanPreparation',
  InstitutionNetwork: undefined,
  PcrPerson: 'dnaSequence',
  FieldNotebookPageSet: 'fieldNotebook',
};
