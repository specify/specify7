import { f } from '../../utils/functools';
import type { RR } from '../../utils/types';
import { filterArray } from '../../utils/types';
import type { Relationship } from '../DataModel/specifyField';
import { genericTables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { error } from '../Errors/assert';
import { softFail } from '../Errors/Crash';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';

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
        Object.entries(genericTables).map(([name, table]) => {
          if (name in overrides) {
            const override = overrides[name];
            return override === undefined
              ? undefined
              : [name, table.strictGetRelationship(override)];
          }
          /*
           * I.e, for AccessionAgent, strip the "Agent" part and check if there
           * is a table by the resulting name (i.e., Accession)
           */
          const potentialParentTable = name
            .replaceAll(/([a-z])([A-Z])/gu, '$1 $2')
            .split(' ')
            .slice(0, -1)
            .join('');
          const relationships = table.relationships.filter(
            (relationship) =>
              relationship.relatedTable.name === potentialParentTable &&
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
          if (relationship === undefined) return undefined;
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
    | keyof Tables[TABLE_NAME]['toOneIndependent']
    | undefined;
} = {
  Address: 'agent',
  Author: 'referenceWork',
  CommonNameTx: 'taxon',
  BorrowReturnMaterial: 'borrowMaterial',
  CollectionObject: undefined,
  CollectionObjectGroupJoin: 'parentcog',
  CollectionRelationship: undefined,
  Collector: 'collectingEvent',
  DNASequencingRun: 'dnaSequence',
  Exsiccata: 'referenceWork',
  Extractor: 'dnaSequence',
  Determiner: 'determination',
  FieldNotebookPage: 'pageSet',
  LatLonPolygon: 'locality',
  LoanReturnPreparation: 'loanPreparation',
  InstitutionNetwork: undefined,
  MaterialSample: 'preparation',
  PcrPerson: 'dnaSequence',
  FieldNotebookPageSet: 'fieldNotebook',
};
