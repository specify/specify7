import QUnit from 'qunit';
import dataModelStorage from '../wbplanviewmodel';
import dataModel from './fixtures/wbplanviewmodel.json';
import testLatLongUtils from './testlatlongutils';


export function runTest<TEST_FUNCTION extends ((...args: any[]) => any)>(
  moduleName: string,
  inputOutputSet: [Parameters<TEST_FUNCTION>, ReturnType<TEST_FUNCTION>][],
  testFunction: TEST_FUNCTION,
): void {
  QUnit.module(moduleName);
  inputOutputSet.map(([input, output], index) => QUnit.test(
    `#${index}`,
    () => QUnit.assert.deepEqual(
      output,
      testFunction(...input),
    ),
  ));
}

export function loadDataModel():void {
  if (typeof dataModelStorage.tables === 'undefined')
    Object.entries(dataModel).forEach(([key, value]) => {
      // @ts-ignore
      dataModelStorage[key] = value;
    });
}

function runTests() {
  testLatLongUtils();

}

runTests();
