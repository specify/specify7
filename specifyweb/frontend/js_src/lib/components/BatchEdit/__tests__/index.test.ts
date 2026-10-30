import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import { tables } from '../../DataModel/tables';
import type { QueryField } from '../../QueryBuilder/helpers';
import type { MappingPath } from '../../WbPlanView/Mapper';
import { buildBatchEditFromQueryBody } from '../index';

requireContext();

const queryField = (
  mappingPath: MappingPath,
  isDisplay: boolean = true
): QueryField => ({
  id: 0,
  mappingPath,
  sortType: undefined,
  isDisplay,
  filters: [],
});

/* A query over Collection Object that reaches through a to-one relationship
 * (accession), a to-many one (accession agents), and an unchecked field.
 */
const fields: RA<QueryField> = [
  queryField(['catalogNumber']),
  queryField(['guid'], false), // Unchecked in the query builder
  queryField(['accession', 'accessionNumber']),
  queryField(['accession', 'accessionAgents', '#1', 'role']),
];

const buildBody = (
  hasRelationships: boolean,
  extraFields: RA<QueryField> = fields
) =>
  buildBatchEditFromQueryBody({
    query: new tables.SpQuery.Resource({ name: 'Test Query' }),
    limit: 5000,
    fields: extraFields,
    baseTableName: 'CollectionObject',
    dataSetName: 'Test Query - Fri Sep 11 2026',
    recordSetId: 42,
    treeDefsFilter: {},
    hasRelationships,
  });

describe('buildBatchEditFromQueryBody', () => {
  test('captions describe each displayed field with relationships', () => {
    expect(buildBody(true).captions).toEqual([
      'Cat #',
      'Accession #',
      'Accession Agents - Role',
    ]);
  });

  test('fields hidden in the query builder get no caption', () => {
    const captions = buildBody(true).captions;
    expect(captions).toHaveLength(3);
    expect(captions).not.toContain('Collection Object - GUID');
  });

  // Covers front end half of verifying relationships are not editable.
  test('omitRelationships is the inverse of the preference', () => {
    expect(buildBody(true).omitrelationships).toBe(false);
    expect(buildBody(false).omitrelationships).toBe(true);
  });

  test('carries the data set name, limit and record set through', () => {
    const body = buildBody(true);
    expect(body.name).toBe('Test Query - Fri Sep 11 2026');
    expect(body.limit).toBe(5000);
    expect(body.recordsetid).toBe(42);
  });
});
