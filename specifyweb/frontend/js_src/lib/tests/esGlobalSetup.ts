import './__mocks__/CSS';
import { initialContext, unlockInitialContext } from '../initialcontext';
import { treeRanksPromise } from '../treedefinitions';

// FIXME: remove this file

// FIXME: go over git diff
// FIXME: go over commented out code

export async function esGlobalSetup() {
  unlockInitialContext('main');
  const groupName = 'Loading initial context';
  console.group(groupName);
  await initialContext;
  await treeRanksPromise;
  console.groupEnd();
}
