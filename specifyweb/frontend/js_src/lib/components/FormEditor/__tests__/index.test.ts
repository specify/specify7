import { requireContext } from '../../../tests/helpers';
import { removeKey, replaceItem } from '../../../utils/utils';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { formatXmlNode } from '../../Syncer/formatXmlNode';
import { syncers } from '../../Syncer/syncers';
import type { XmlNode } from '../../Syncer/xmlToJson';
import { jsonToXml, toSimpleXmlNode, xmlToJson } from '../../Syncer/xmlToJson';
import { xmlToString } from '../../Syncer/xmlUtils';
import { exportsForTests } from '../index';
import type { ViewSets } from '../spec';
import { viewSetsSpec } from '../spec';

const { injectRawXml, replaceXmlContent } = exportsForTests;

requireContext();

const definition = `
    <desc><![CDATA[The Accession form.]]></desc>
    <enableRules/>
    <columnDef>100px,2px,175px,5px,140px,2px,161px,5px,75px,2px,160px,0px,15px,p:g</columnDef>
    <columnDef os="lnx">115px,2px,185px,5px,160px,2px,180px,5px,105px,2px,156px,0px,15px,p:g</columnDef>
    <columnDef os="mac">130px,2px,205px,5px,180px,2px,200px,5px,125px,2px,176px,0px,15px,p:g</columnDef>
    <columnDef os="exp">p,2px,p:g,5px:g,p,2px,p:g,5px:g,p,2px,p:g,0px,p,p:g</columnDef>
    <rowDef auto="true" cell="p" sep="1px"/>
    <rows>
      <row>
        <!-- <cell type="label" labelfor="1"/> -->
        <cell type="field" id="1" name="accessionNumber" uitype="formattedtext"/>
        <cell type="label" labelfor="2"/>
        <cell type="field" id="2" name="status"  uitype="combobox"/>
        <cell type="label" labelfor="3"/>
        <cell type="field" id="3" name="type" uitype="combobox" />
      </row>
      <row>
        <cell type="label" labelfor="12"/>
        <cell type="field" id="12" name="dateAccessioned" uitype="formattedtext" uifieldformatter="Date" default="today"/>
        <cell type="label" labelfor="6"/>
        <cell type="field" id="6" name="dateReceived" uitype="formattedtext" uifieldformatter="Date" default="today" />
      </row>
    </rows>
`;

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
  >${definition}</viewdef>
</viewdefs>
</viewset>
`;

const process = (node: XmlNode): string =>
  xmlToString(jsonToXml(formatXmlNode(node)));

test('Can edit a form definition', () => {
  const { serializer, deserializer } = syncers.object(viewSetsSpec());
  const xmlNode = xmlToJson(strictParseXml(xml));
  const parsed = serializer(toSimpleXmlNode(xmlNode));
  const augmented = injectRawXml(xmlNode, parsed);
  const raw = augmented.viewDefs[0].raw;

  // Verify that view sets are parsed correctly
  expect({
    ...augmented,
    viewDefs: replaceItem(
      augmented.viewDefs,
      0,
      removeKey(augmented.viewDefs[0], 'raw')
    ),
  }).toMatchSnapshot();

  // Verify that view definition xml can be converted back to the same string
  const initialXml = process(raw);
  expect(initialXml).toBe(
    process(xmlToJson(strictParseXml(`<viewdef>${definition}</viewdef>`)))
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
  expect(
    replaceXmlContent(xmlNode, deserializer, newAugmented)
  ).toMatchSnapshot();
});
