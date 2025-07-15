import mappingLines1 from '../../../tests/fixtures/mappinglines.1.json';
import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import type { IR, RA } from '../../../utils/types';
import type { SplitMappingPath } from '../mappingHelpers';
import { findRequiredMissingFields } from '../modelHelpers';

requireContext();

theories(findRequiredMissingFields, [
  {
    in: [
      mappingLines1.baseTableName as 'CollectionObject',
      (mappingLines1.lines as RA<SplitMappingPath>).map(
        ({ mappingPath }) => mappingPath
      ),
      mappingLines1.mustMatchPreferences as IR<boolean>,
    ],
    out: [['collectingEvent', 'locality', 'localityName']],
  },
]);
