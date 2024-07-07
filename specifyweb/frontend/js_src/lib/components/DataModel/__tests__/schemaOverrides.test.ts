import { theories } from '../../../tests/utils';
import {
  getFieldOverwrite,
  getGlobalFieldOverwrite,
  getTableOverwrite,
} from '../schemaOverrides';

theories(getTableOverwrite, [
  { in: ['Accession'], out: 'commonBaseTable' },
  { in: ['TaxonTreeDefItem'], out: 'system' },
  { in: ['SpQuery'], out: undefined },
]);

theories(getGlobalFieldOverwrite, [
  { in: ['Taxon', 'isAccepted'], out: { accessibility: 'readOnly' } },
  { in: ['Geography', 'timestampCreated'], out: { accessibility: 'readOnly' } },
  {
    in: ['TaxonTreeDefItem', 'fullNameSeparator'],
    out: { whiteSpaceSensitive: true },
  },
  { in: ['SpecifyUser', 'id'], out: undefined },
]);

theories(getFieldOverwrite, [
  { in: ['Taxon', 'timestampCreated'], out: { accessibility: 'hidden' } },
  { in: ['Agent', 'agentType'], out: { accessibility: 'optional' } },
  { in: ['Agent', 'lastName'], out: undefined },
  {
    in: ['Attachment', 'collectingTripAttachments'],
    out: { accessibility: 'hidden' },
  },
]);
