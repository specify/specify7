/**
 * Localization strings used by Express Search configuration screens.
 *
 * @module
 */

import { createDictionary } from './utils';

export const expressSearchConfigText = createDictionary({
  loadingConfig: {
    'en-us': 'Loading...',
  },
  loadingMetadata: {
    'en-us': 'Loading metadata...',
  },
  expressSearchConfigTitle: {
    'en-us': 'Express Search Config',
  },
  searchFieldsTab: {
    'en-us': 'Search Fields',
  },
  relatedTablesTab: {
    'en-us': 'Related Tables',
  },
  resultsOrderingTab: {
    'en-us': 'Results Ordering',
  },
  availableTables: {
    'en-us': 'Available Tables',
  },
  searchableFields: {
    'en-us': 'Searchable Fields',
  },
  searchLabel: {
    'en-us': 'Search',
  },
  fieldName: {
    'en-us': 'Field',
  },
  sortMode: {
    'en-us': 'Sort Mode',
  },
  searchNone: {
    'en-us': 'None',
  },
  ascendingOrder: {
    'en-us': 'Ascending',
  },
  descendingOrder: {
    'en-us': 'Descending',
  },
  displayFields: {
    'en-us': 'Display Fields',
  },
  configureResultsOrdering: {
    'en-us': 'Configure Results Ordering',
  },
  reorderResultsOrderingDescription: {
    'en-us': 'Reorder how sections appear in the search results pane.',
  },
  relatedQueryLabel: {
    'en-us': 'Related Query: {query:string}',
  },
  noDisplayItemsConfigured: {
    'en-us': 'No display items configured.',
  },
  selectAllQueries: {
    'en-us': 'Select All',
  },
  deselectAllQueries: {
    'en-us': 'Deselect All',
  },
  noRelatedQueriesAvailable: {
    'en-us': 'No related queries available for selected tables.',
  },
  selectRelatedQueryDescription: {
    'en-us': 'Select a related query to see its description.',
  },
  noDescriptionAvailable: {
    'en-us': 'No description available.',
  },
  CollObjToDeterminer: {
    'en-us': 'Taxon CollectionObject',
  },
  CollObjToDeterminer_desc: {
    'en-us':
      'Collection objects with current determinations, showing the determined taxon name, taxon common name, and determiner.',
  },
  CollObToLocality: {
    'en-us': 'Collecting Event Locality',
  },
  CollObToLocality_desc: {
    'en-us':
      'Collecting events and their localities, including event dates and geographic coordinates.',
  },
  CollObject: {
    'en-us': 'Collection Object Taxon',
  },
  CollObject_desc: {
    'en-us': 'Collection objects with their determined taxon names.',
  },
  GeoToTaxon: {
    'en-us': 'Taxon Geography',
  },
  GeoToTaxon_desc: {
    'en-us':
      'Taxa linked to geography records through collection object determinations and collecting event localities.',
  },
  ColObjCollectors: {
    'en-us': 'Collection Object Collectors',
  },
  ColObjCollectors_desc: {
    'en-us':
      'Collection objects and the agents who collected them, with collecting event dates.',
  },
  AcceptedTaxon: {
    'en-us': 'Taxon Preferred Taxon',
  },
  AcceptedTaxon_desc: {
    'en-us':
      'Taxa with preferred accepted taxon names, excluding records missing accepted taxon links.',
  },
  SynonymCollObjs: {
    'en-us': 'Collection Object Preferred Taxon',
  },
  SynonymCollObjs_desc: {
    'en-us':
      'Collection objects with determinations that have both an original taxon and a preferred taxon.',
  },
  OtherSynsCollObjs: {
    'en-us': 'Collection Object Taxon (all synonyms)',
  },
  OtherSynsCollObjs_desc: {
    'en-us':
      'Collection objects showing determinations, preferred taxon names, and accepted synonym children names.',
  },
  CurrCollObject: {
    'en-us': 'Collection Object Taxon (determined)',
  },
  CurrCollObject_desc: {
    'en-us': 'Collection objects with their current taxon determination only.',
  },
  AgentFromAgentVariant: {
    'en-us': 'Agent Agent Variant',
  },
  AgentFromAgentVariant_desc: {
    'en-us': 'Agent variants paired with their parent agent records.',
  },
  Agent: {
    'en-us': 'Agent',
  },
  Agent_desc: {
    'en-us': 'Individual agents.',
  },
  AgentVariant: {
    'en-us': 'Agent Variant',
  },
  AgentVariant_desc: {
    'en-us': 'Agent variant records.',
  },
  LocalityAlias: {
    'en-us': 'Locality Locality Alias',
  },
  LocalityAlias_desc: {
    'en-us': 'Locality records with associated locality name aliases.',
  },
  CEToCO: {
    'en-us': 'Collection Object Collecting Event',
  },
  CEToCO_desc: {
    'en-us': 'Collecting events linked to collection objects.',
  },
  LocToCO: {
    'en-us': 'Collection Object Locality',
  },
  LocToCO_desc: {
    'en-us':
      'Localities and the collection objects found at their collecting events.',
  },
  AccessionToCo: {
    'en-us': 'Collection Object Accession',
  },
  AccessionToCo_desc: {
    'en-us':
      'Accessions and their collection objects, filtered to current determinations.',
  },
  AccessionToAgent: {
    'en-us': 'Agent Accession',
  },
  AccessionToAgent_desc: {
    'en-us': 'Accessions and the agents associated via accession agent roles.',
  },
  BorrowToAgent: {
    'en-us': 'Agent Borrow',
  },
  BorrowToAgent_desc: {
    'en-us': 'Borrows and the agents linked through borrow agent roles.',
  },
  AppraisalToAgent: {
    'en-us': 'Agent Appraisal',
  },
  AppraisalToAgent_desc: {
    'en-us': 'Appraisals and their associated agents.',
  },
  GeoTimePeriodToCO: {
    'en-us': 'Collection Object Chronostratigraphy',
  },
  GeoTimePeriodToCO_desc: {
    'en-us':
      'Geologic time periods with collection objects connected through chronostratigraphic contexts.',
  },
  CollEventToCollectors: {
    'en-us': 'Collector CollectingEvent',
  },
  CollEventToCollectors_desc: {
    'en-us':
      'Collecting events paired with the agents who collected specimens.',
  },
  AgentExchangeIn: {
    'en-us': 'Exchange In Agent',
  },
  AgentExchangeIn_desc: {
    'en-us': 'Incoming exchanges and the agents material was received from.',
  },
  AgentExchangeOut: {
    'en-us': 'Exchange Out Agent',
  },
  AgentExchangeOut_desc: {
    'en-us': 'Outgoing exchanges and the agents material was sent to.',
  },
  GeographyCE: {
    'en-us': 'Collecting Event Geography',
  },
  GeographyCE_desc: {
    'en-us':
      'Collecting events with the geography area of each event locality.',
  },
  GeographyCO: {
    'en-us': 'Collection Object Geography',
  },
  GeographyCO_desc: {
    'en-us':
      'Collection objects linked to the geography areas of their collecting event localities.',
  },
  GiftCO: {
    'en-us': 'Collection Object Gift',
  },
  GiftCO_desc: {
    'en-us': 'Gifts with the collection objects attached to gift preparations.',
  },
  GiftAgent: {
    'en-us': 'Agent Gift',
  },
  GiftAgent_desc: {
    'en-us': 'Gifts and the agents associated with those gifts.',
  },
  LoanCO: {
    'en-us': 'Collection Object Loan',
  },
  LoanCO_desc: {
    'en-us': 'Loans with the collection objects on loan preparations.',
  },
  LoanAgent: {
    'en-us': 'Agent Loan',
  },
  LoanAgent_desc: {
    'en-us': 'Loans and the agents involved through loan agent roles.',
  },
  LithoStratToCO: {
    'en-us': 'Collection Object Lithostratigraphy',
  },
  LithoStratToCO_desc: {
    'en-us':
      'Lithostratigraphic units and collection objects associated through paleocontext relationships.',
  },
  PermitToCO: {
    'en-us': 'Collection Object Permit',
  },
  PermitToCO_desc: {
    'en-us':
      'Permits and collection objects tied through accession authorization relationships.',
  },
  PermitIssuedToAgent: {
    'en-us': 'Agent Issued to Permit',
  },
  PermitIssuedToAgent_desc: {
    'en-us': 'Permits and the agents to whom they were issued.',
  },
  PermitIssuedByAgent: {
    'en-us': 'Agent Issued by Permit',
  },
  PermitIssuedByAgent_desc: {
    'en-us': 'Permits and the agents who issued them.',
  },
  ProjectAgent: {
    'en-us': 'Agent Project',
  },
  ProjectAgent_desc: {
    'en-us': 'Projects and their assigned agents.',
  },
  RepoAgreeAgent: {
    'en-us': 'Agent Repository Agreement',
  },
  RepoAgreeAgent_desc: {
    'en-us': 'Repository agreements and their originating agents.',
  },
  StorageCO: {
    'en-us': 'Collection Object Storage',
  },
  StorageCO_desc: {
    'en-us': 'Collection objects and their storage locations.',
  },
  TaxCollObject: {
    'en-us': 'Collection Object Taxon',
  },
  TaxCollObject_desc: {
    'en-us': 'Collection objects and their determination taxon records.',
  },
  ExchangeInCO: {
    'en-us': 'Collection Object Exchange In',
  },
  ExchangeInCO_desc: {
    'en-us':
      'Incoming exchanges with collection objects in exchanged preparations.',
  },
  ExchangeOutCO: {
    'en-us': 'Collection Object Exchange Out',
  },
  ExchangeOutCO_desc: {
    'en-us':
      'Outgoing exchanges with collection objects in exchanged preparations.',
  },
}) as any;

export function getExpressSearchQueryTitle(id: number | string): string {
  const key = String(id);
  const getter = (expressSearchConfigText as Record<string, unknown>)[key];
  return typeof getter === 'function' ? getter() : key;
}

export function getExpressSearchQueryDescription(
  id: number | string
): string | undefined {
  const key = `${String(id)}_desc`;
  const getter = (expressSearchConfigText as Record<string, unknown>)[key];
  return typeof getter === 'function' ? getter() : undefined;
}
