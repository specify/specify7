import QUnit from 'qunit';

import type { RA } from '../types';
import testAutoMapper from './testautomapper';
import testLatLongUtils from './testlatlongutils';
import testUploadPlanParser from './testuploadplanparser';
import testUploadPlanBuilder from './testuploadplanbuilder';
import testWbPlanViewLinesGetter from './testwbplanviewlinesgetter';
import testWbPlanViewTreePreview from './testwbplanviewmappingpreview';
import testWbPlanViewModelHelper from './testwbplanviewmodelhelper';
import testWbPlanViewNavigator from './testwbplanviewnavigator';
import { initialContext, unlockInitialContext } from '../initialcontext';
import { crash } from '../components/errorboundary';

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
  unlockInitialContext();
  await initialContext.catch(crash);

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
