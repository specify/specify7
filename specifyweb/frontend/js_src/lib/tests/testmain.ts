import QUnit from 'qunit';

import { getTreeDefinitionItems, setupForTests } from '../treedefinitions';
import type { RA } from '../types';
import dataModelStorage from '../wbplanviewmodel';
import dataModel from './fixtures/wbplanviewmodel.json';
import testAutoMapper from './testautomapper';
import testLatLongUtils from './testlatlongutils';
import testMappingsTreeToUploadPlan from './testmappingstreetouploadplan';
import testUploadPlanToMappingsTree from './testuploadplantomappingstree';
import testWbPlanViewHelper from './testwbplanviewhelper';
import testWbPlanViewLinesGetter from './testwbplanviewlinesgetter';
import testWbPlanViewTreePreview from './testwbplanviewmappingpreview';
import testWbPlanViewModelHelper from './testwbplanviewmodelhelper';
import testWbPlanViewNavigator from './testwbplanviewnavigator';
import testWbPlanViewTreeHelper from './testwbplanviewtreehelper';

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
  await setupForTests();

  Object.entries(dataModel).forEach(([key, value]) => {
    // @ts-expect-error Data model is loaded from a JSON file
    dataModelStorage[key] = value;
  });

  console.log(getTreeDefinitionItems('Geography', false));

  testLatLongUtils();
  testMappingsTreeToUploadPlan();
  testUploadPlanToMappingsTree();
  testWbPlanViewHelper();
  testWbPlanViewLinesGetter();
  testWbPlanViewModelHelper();
  testWbPlanViewTreeHelper();
  testWbPlanViewNavigator();
  testWbPlanViewTreePreview();
  testAutoMapper();
}

runTests();
