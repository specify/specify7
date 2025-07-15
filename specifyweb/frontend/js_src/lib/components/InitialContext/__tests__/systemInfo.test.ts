import { requireContext } from '../../../tests/helpers';
import { fetchContext } from '../systemInfo';

requireContext();

test('can fetch and parse system information', async () =>
  expect(fetchContext).resolves.toEqual({
    collection: 'KU Fish Voucher Collection',
    collection_guid: '3f55b3fa-292d-4170-bd46-66dca41d7f05',
    database: 'specify',
    database_version: '6.8.03',
    discipline: 'Ichthyology',
    institution: 'University of Kansas Biodiversity Institute',
    institution_guid: '77ff1bff-af23-4647-b5d1-9d3c414fd003',
    isa_number: '2014427',
    schema_version: '2.9',
    specify6_version: '6.8.03',
    stats_url: 'https://stats.specifycloud.org/capture',
    version: '(debug)',
  }));
