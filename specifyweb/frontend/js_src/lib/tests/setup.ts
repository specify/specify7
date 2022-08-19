/**
 * Setup file. This runs for each test file
 */

import './__mocks__/CSS';
import './__mocks__/Response';
import { initialContext, unlockInitialContext } from '../initialcontext';
import { treeRanksPromise } from '../treedefinitions';

export default async function () {
  unlockInitialContext('main');
  // FIXME: remove commented out code
  // console.group('Loading initial context');
  await initialContext;
  await treeRanksPromise;
  // console.groupEnd();
}
