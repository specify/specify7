import QUnit from 'qunit';

import { initialContext, unlockInitialContext } from '../initialcontext';
import type { RA } from '../types';
import testAutoMapper from './testautomapper';
import testLatLongUtils from './testlatlongutils';
import testUploadPlanBuilder from './testuploadplanbuilder';
import testUploadPlanParser from './testuploadplanparser';
import testWbPlanViewLinesGetter from './testwbplanviewlinesgetter';
import testWbPlanViewTreePreview from './testwbplanviewmappingpreview';
import testWbPlanViewModelHelper from './testwbplanviewmodelhelper';
import testWbPlanViewNavigator from './testwbplanviewnavigator';

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
  unlockInitialContext('main');
  await initialContext;

  testLatLongUtils();
  testUploadPlanParser();
  testUploadPlanBuilder();
  testWbPlanViewLinesGetter();
  testWbPlanViewModelHelper();
  testWbPlanViewNavigator();
  testWbPlanViewTreePreview();
  testAutoMapper();
}

runTests();
