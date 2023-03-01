import { RA } from '../../utils/types';
import { BrokerRecord } from '../SpecifyNetwork/fetchers';

export function SpecifyNetworkMap({
  occurrence,
  species,
  speciesName,
}: {
  readonly occurrence: RA<BrokerRecord> | undefined;
  readonly species: RA<BrokerRecord> | undefined;
  readonly speciesName: string | undefined;
}): JSX.Element {
  // FIXME: implement
}
