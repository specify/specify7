import { initialContext, unlockInitialContext } from '../initialcontext';
import { treeRanksPromise } from '../treedefinitions';

// FIXME: remove commented out code
/**
 * Call this in test files that requite initial context to be fetched
 *
 * Initial context would be populated with static data.
 */
export const requireContext = (): void =>
  beforeAll(async () => {
    unlockInitialContext('main');
    await initialContext;
    await treeRanksPromise;
  });
