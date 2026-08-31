/**
 * Hardcoded default field/relationship lists used to seed a starter Data View
 * query for the built-in default tables (see DataViewTables.tsx).
 */

import { dataViewsText } from '../../localization/dataViews';
import type { RA, RR } from '../../utils/types';
import { strictGetTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { createQuery } from '../QueryBuilder';
import { makeSerializedFieldsFromPaths } from '../Statistics/hooks';

export const defaultDataViewQueryFields: Partial<RR<keyof Tables, RA<string>>> =
  {
    Accession: [
      'accessionNumber',
      'status',
      'type',
      'remarks',
      'division.name',
      'repositoryAgreement.repositoryAgreementNumber',
    ],
    Agent: [
      'firstName',
      'lastName',
      'email',
      'jobTitle',
      'division.name',
      'organization.lastName',
    ],
    CollectionObject: [
      'catalogNumber',
      'fieldNumber',
      'description',
      'collectionObjectType.name',
      'collection.collectionName',
    ],
    CollectingEvent: [
      'stationFieldNumber',
      'startDate',
      'method',
      'remarks',
      'locality.localityName',
      'discipline.name',
    ],
    Gift: [
      'giftNumber',
      'giftDate',
      'status',
      'purposeOfGift',
      'discipline.name',
      'division.name',
    ],
    Loan: [
      'loanNumber',
      'loanDate',
      'currentDueDate',
      'status',
      'discipline.name',
      'division.name',
    ],
    Locality: [
      'localityName',
      'namedPlace',
      'remarks',
      'geography.name',
      'discipline.name',
    ],
  };

/** Creates and saves a default Data View query for a table. Returns its new id */
export async function createDefaultDataViewQuery(
  tableName: keyof Tables
): Promise<number | undefined> {
  const paths = defaultDataViewQueryFields[tableName];
  if (paths === undefined) return undefined;

  const table = strictGetTable(tableName);
  const query = createQuery(
    dataViewsText.dataViewQueryName({ tableLabel: table.label }),
    table
  );
  query.set('isDataView', true);
  query.set(
    'fields',
    makeSerializedFieldsFromPaths(
      tableName,
      paths.map((path) => ({ path }))
    )
  );
  await query.save();
  return query.id;
}
