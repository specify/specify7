import {
  getFieldOverwrite,
  getGlobalFieldOverwrite,
  getTableOverwrite,
} from '../schemaOverrides';
import { theories } from '../../../tests/utils';

theories(getTableOverwrite, [
  { in: ['Accession'], out: 'commonBaseTable' },
  { in: ['TaxonTreeDefItem'], out: 'system' },
  { in: ['SpQuery'], out: undefined },
]);

theories(getGlobalFieldOverwrite, [
  { in: ['Taxon', 'guid'], out: 'readOnly' },
  { in: ['Geography', 'timestampCreated'], out: 'readOnly' },
  { in: ['SpecifyUser', 'id'], out: undefined },
]);

theories(getFieldOverwrite, [
  { in: ['Taxon', 'timestampCreated'], out: 'hidden' },
  { in: ['Agent', 'agentType'], out: 'optional' },
  { in: ['Agent', 'lastName'], out: undefined },
  { in: ['Attachment', 'collectingTripAttachments'], out: 'hidden' },
]);
