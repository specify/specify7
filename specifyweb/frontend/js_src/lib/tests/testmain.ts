import QUnit from 'qunit';

import { initialContext, unlockInitialContext } from '../initialcontext';
import { treeRanksPromise } from '../treedefinitions';
import type { RA } from '../types';
import { leafletStub } from './leafletstub';
import { testAutoMapper } from './testautomapper';
import { testLatLongUtils } from './testlatlongutils';
import { testUploadPlanBuilder } from './testuploadplanbuilder';
import { testUploadPlanParser } from './testuploadplanparser';
import { testWbPlanViewLinesGetter } from './testwbplanviewlinesgetter';
import { testWbPlanViewMappingHelper } from './testwbplanviewmappinghelper';
import { testWbPlanViewTreePreview } from './testwbplanviewmappingpreview';
import { testWbPlanViewModelHelper } from './testwbplanviewmodelhelper';
import { testWbPlanViewNavigator } from './testwbplanviewnavigator';

export function runTest<ARGUMENTS_TYPE extends RA<unknown>, RETURN_TYPE>(
  moduleName: string,
  inputOutputSet: RA<[ARGUMENTS_TYPE, RETURN_TYPE]>,
  testFunction: (...arguments_: ARGUMENTS_TYPE) => RETURN_TYPE
): void {
  QUnit.module(moduleName);
  inputOutputSet.forEach(([input, output], index) =>
    QUnit.test(`#${index}`, () =>
      QUnit.assert.deepEqual(testFunction(...input), output)
    )
  );
}

async function runTests(): Promise<void> {
  leafletStub();

  unlockInitialContext('main');

  const groupName = 'Loading initial context';
  QUnit.test(groupName, async (assert) => {
    assert.expect(0);
    // This is needed to make QUnit wait for async promises to complete
    const done = assert.async();
    console.group(groupName);
    await initialContext;
    await treeRanksPromise;
    console.groupEnd();
    done();

    testLatLongUtils();
    testUploadPlanParser();
    testUploadPlanBuilder();
    testWbPlanViewLinesGetter();
    testWbPlanViewModelHelper();
    testWbPlanViewNavigator();
    testWbPlanViewTreePreview();
    testWbPlanViewMappingHelper();
    testAutoMapper();
  });
}

runTests();
