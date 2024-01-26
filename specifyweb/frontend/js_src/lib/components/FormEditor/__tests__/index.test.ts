import { requireContext } from '../../../tests/helpers';
import { removeKey, replaceItem } from '../../../utils/utils';
import { strictParseXml } from '../../AppResources/parseXml';
import { formatXmlNode } from '../../Syncer/formatXmlNode';
import { syncers } from '../../Syncer/syncers';
import type { XmlNode } from '../../Syncer/xmlToJson';
import { jsonToXml, toSimpleXmlNode, xmlToJson } from '../../Syncer/xmlToJson';
import { updateXml, xmlToString } from '../../Syncer/xmlToString';
import { exportsForTests } from '../index';
import type { ViewSets } from '../spec';
import { viewSetsSpec } from '../spec';
import { testFormDefinition } from './testFormDefinition';

const { injectRawXml } = exportsForTests;

requireContext();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<viewset name="Fish Views" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<views>
  <view
    name="Accession"
    class="edu.ku.brc.specify.datamodel.Accession"
    busrules="edu.ku.brc.specify.datamodel.busrules.AccessionBusRules"
    resourcelabels="false"
  >
    <desc><![CDATA[The Accession form.]]></desc>
    <!-- Some comment -->
    <altviews>
      <altview name="Accession View" viewdef="Accession" mode="view" default="true"/>
      <altview name="Accession Edit" viewdef="Accession" mode="edit"/>
    </altviews>
  </view>
</views>
<viewdefs>
  <viewdef
    type="form"
    name="Accession"
    class="edu.ku.brc.specify.datamodel.Accession"
    gettable="edu.ku.brc.af.ui.forms.DataGetterForObj"
    settable="edu.ku.brc.af.ui.forms.DataSetterForObj"
  >${testFormDefinition}</viewdef>
</viewdefs>
</viewset>
`;

const process = (node: XmlNode): string =>
  xmlToString(jsonToXml(formatXmlNode(node)));

test('Can edit a form definition', () => {
  const { serializer, deserializer } = syncers.object(viewSetsSpec());
  const xmlNode = xmlToJson(strictParseXml(xml));
  const parsed = serializer(toSimpleXmlNode(xmlNode));
  const augmented = injectRawXml(parsed);
  const raw = augmented.viewDefs[0].raw;

  // Verify that view sets are parsed correctly
  const reconstructed = {
    ...augmented,
    viewDefs: replaceItem(
      augmented.viewDefs,
      0,
      removeKey(augmented.viewDefs[0], 'raw')
    ),
  };
  // Get rid of symbols
  expect(JSON.parse(JSON.stringify(reconstructed))).toMatchSnapshot();

  // Verify that view definition xml can be converted back to the same string
  const initialXml = process({ ...raw, attributes: {} });
  expect(initialXml).toBe(
    process(
      xmlToJson(strictParseXml(`<viewdef>${testFormDefinition}</viewdef>`))
    )
  );

  // Make a small edit
  const columnDefinitionIndex = raw.children.findIndex(
    (node) => node.type === 'XmlNode' && node.tagName === 'columnDef'
  );
  const newAugmented: ViewSets = {
    ...augmented,
    views: [
      {
        ...augmented.views[0],
        altViews: {
          ...augmented.views[0].altViews,
          altViews: [
            augmented.views[0].altViews.altViews[0],
            ...replaceItem(augmented.views[0].altViews.altViews, 1, {
              ...augmented.views[0].altViews.altViews[1],
              name: 'Accession View (Edited)',
            }),
          ],
        },
      },
    ],
    viewDefs: [
      {
        ...augmented.viewDefs[0],
        raw: {
          ...augmented.viewDefs[0].raw,
          children: [
            ...augmented.viewDefs[0].raw.children.slice(
              0,
              columnDefinitionIndex + 2
            ),
            {
              type: 'XmlNode',
              tagName: 'columnDef',
              attributes: {
                test: 'a',
              },
              children: [{ type: 'Text', string: 'test' }],
            },
            ...augmented.viewDefs[0].raw.children.slice(
              columnDefinitionIndex - 1
            ),
          ],
        },
      },
    ],
  };

  // Verify that can turn it all back
  expect(updateXml(deserializer(newAugmented))).toMatchSnapshot();
});
