// This test is currently failing because Leaflet does not support SSR

import QUnit from 'qunit';
import * as LeafletUtils from '../leafletutils';

export default function():void {
  QUnit.module('leafletutils.cellIsValid');

  [
    [
      [
        ['12.34', '11.2', '0', '56 65\'\''],
        {
          'latitude1': 0,
          'longitude1': 1,
          'latitude2': 2,
          'longitude2': 3,
        },
        'latitude1'
      ],
      true,
    ],
  ].map(([input, output], index) => QUnit.test(
    `LeafletUtils.cellIsValid #${index}`,
    () => QUnit.assert.equal(
      JSON.stringify(output),
      // @ts-ignore
      LeafletUtils.cellIsValid(...input)
    )
  ));

}
