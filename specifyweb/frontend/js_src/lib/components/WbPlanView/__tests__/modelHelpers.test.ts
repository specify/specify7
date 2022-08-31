import type { IR, RA } from '../../../utils/types';
import type { SplitMappingPath } from '../mappingHelpers';
import mappingLines1 from '../../../tests/fixtures/mappinglines.1.json';
import { theories } from '../../../tests/utils';
import { findRequiredMissingFields } from '../modelHelpers';
import { requireContext } from '../../../tests/helpers';

requireContext();

theories(findRequiredMissingFields, [
  {
    in: [
      mappingLines1.baseTableName as 'Accession',
      (mappingLines1.lines as RA<SplitMappingPath>).map(
        ({ mappingPath }) => mappingPath
      ),
      mappingLines1.mustMatchPreferences as IR<boolean>,
    ],
    out: [['collectingEvent', 'locality', 'localityName']],
  },
]);
