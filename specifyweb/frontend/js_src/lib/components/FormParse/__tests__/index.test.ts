import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { Http } from '../../../utils/ajax/definitions';
import type { RA } from '../../../utils/types';
import { ensure, localized } from '../../../utils/types';
import { removeKey } from '../../../utils/utils';
import { strictParseXml } from '../../AppResources/parseXml';
import { tables } from '../../DataModel/tables';
import { getPref } from '../../InitialContext/remotePrefs';
import { formatUrl } from '../../Router/queryString';
import type { SimpleXmlNode } from '../../Syncer/xmlToJson';
import { toSimpleXmlNode, xmlToJson } from '../../Syncer/xmlToJson';
import type { FormCellDefinition } from '../cells';
import type { ParsedFormDefinition, ViewDefinition } from '../index';
import {
  exportsForTests,
  fetchView,
  parseFormDefinition,
  parseViewDefinition,
  resolveViewDefinition,
} from '../index';
import { attachmentView } from '../webOnlyViews';

const {
  views,
  parseViewDefinitions,
  resolveAltView,
  parseFormTableDefinition,
  parseFormTableColumns,
  getColumnDefinitions,
  getColumnDefinition,
  parseRows,
} = exportsForTests;

requireContext();

const altViews = {
  'Preparation Table View': {
    name: 'Preparation Table View',
    viewdef: 'Preparation Table',
    mode: 'view',
  },
  'Preparation Table Edit': {
    name: 'Preparation Table Edit',
    viewdef: 'Preparation Table',
    mode: 'edit',
  },
  'Preparation View': {
    name: 'Preparation View',
    viewdef: 'Preparation',
    mode: 'view',
  },
  'Preparation Edit': {
    name: 'Preparation Edit',
    viewdef: 'Preparation',
    mode: 'edit',
    default: 'true',
  },
} as const;

ensure<ViewDefinition['altviews']>()(altViews);

const xml = (xml: string): SimpleXmlNode =>
  toSimpleXmlNode(xmlToJson(strictParseXml(xml)));

const formView = `<viewdef type="form" class="edu.ku.brc.specify.datamodel.CollectionObject">
    <columnDef os="table">1px,p:g,p:g</columnDef>
    <rows>
      <row>
        <cell type="label" labelFor="tt" label="test" />
      </row> 
      <row>
        <cell type="field" name=" catalogNumber " uiType="text" colSpan="4" align="right" id="tt" />
        <cell type="field" name="accession.text1" uiType="checkbox" label="2" colSpan="1" align="right" />
      </row> 
    </rows>
  </viewdef>`;
const simpleFormView = xml(formView);

const baseCell = {
  id: undefined,
  colSpan: 1,
  align: 'left',
  visible: true,
  ariaLabel: undefined,
  verticalAlign: 'center',
} as const;

const parsedFormView = {
  columns: [1, undefined, undefined],
  rows: [
    [
      {
        ...baseCell,
        align: 'center',
        colSpan: 2,
        id: 'tt',
        type: 'Field',
        fieldDefinition: {
          type: 'Text',
          min: undefined,
          max: undefined,
          maxLength: undefined,
          minLength: undefined,
          step: undefined,
          isReadOnly: false,
          defaultValue: undefined,
          whiteSpaceSensitive: false,
        },
        fieldNames: ['catalogNumber'],
        isRequired: false,
        ariaLabel: localized('test'),
      },
      {
        ...baseCell,
        align: 'center',
        colSpan: 1,
        type: 'Field',
        fieldDefinition: {
          type: 'Checkbox',
          label: undefined,
          printOnSave: false,
          defaultValue: undefined,
          isReadOnly: false,
        },
        fieldNames: ['accession', 'text1'],
        isRequired: false,
        ariaLabel: localized('2'),
      },
    ],
  ],
};

const formTableView = `<viewdef type="formtable" />`;

const tinyFormView = `<viewdef type="form" class="edu.ku.brc.specify.datamodel.CollectionObject">
  <columnDef>1px,p:g,p:g</columnDef>
  <rows>
    <row>
      <cell />
    </row> 
    <row>
      <cell />
      <cell colSpan="4" />
    </row> 
  </rows>
</viewdef>`;

const parsedTinyView: ParsedFormDefinition = {
  columns: [1, undefined, undefined],
  rows: [
    [
      {
        ...baseCell,
        type: 'Unsupported',
        cellType: undefined,
      },
      {
        ...baseCell,
        colSpan: 2,
        visible: false,
        type: 'Blank',
        verticalAlign: 'stretch',
      },
    ],
    [
      {
        ...baseCell,
        type: 'Unsupported',
        cellType: undefined,
      },
      {
        ...baseCell,
        colSpan: 2,
        type: 'Unsupported',
        cellType: undefined,
      },
    ],
  ],
};

const conditionalTinyFormView = strictParseXml(
  `<cell>
    ${Array.from(
      strictParseXml(tinyFormView).children,
      (child) => child.outerHTML
    ).join('\n')}
     <rows condition="accession.accessionNumber=42" colDef="2px,4px,1px">
      <row>
        <cell colSpan="4" />
      </row> 
    </rows>
</cell>`
);
const parsedConditionalTinyView: ParsedFormDefinition = {
  columns: [2, 1],
  rows: [
    [
      {
        ...baseCell,
        colSpan: 2,
        type: 'Unsupported',
        cellType: undefined,
      },
    ],
  ],
};

const viewDefs = {
  Preparation: strictParseXml(formView),
  'Preparation Table': strictParseXml(formTableView),
};

const viewDefinition: ViewDefinition = {
  altviews: altViews,
  busrules: '',
  class: '',
  name: localized(''),
  resourcelabels: 'true',
  viewdefs: {
    Preparation: formView,
  },
  view: '',
  viewsetLevel: '',
  viewsetName: '',
  viewsetSource: '',
  viewsetId: null,
  viewsetFile: null,
};

describe('fetchView', () => {
  const baseViewDefinition: Partial<ViewDefinition> = {
    altviews: {},
    viewdefs: {
      CollectionObject: tinyFormView,
    },
  };

  const viewDefinition = baseViewDefinition as ViewDefinition;

  const viewName = 'abc';
  overrideAjax(
    formatUrl('/context/view.json', { name: viewName }),
    JSON.stringify(viewDefinition)
  );
  test('caches fetched view', async () => {
    await expect(fetchView(viewName)).resolves.toEqual(viewDefinition);
    expect(views[viewName]).toEqual(viewDefinition);
  });

  const secondViewName = 'abc2';
  const secondViewDefinition = baseViewDefinition as ViewDefinition;
  test('retries cached view', async () => {
    views[secondViewName] = secondViewDefinition;
    await expect(fetchView(secondViewName)).resolves.toEqual(viewDefinition);
    expect(views[viewName]).toEqual(secondViewDefinition);
  });

  const notFoundViewName = 'abc3';
  overrideAjax(
    formatUrl('/context/view.json', { name: notFoundViewName }),
    viewDefinition,
    {
      responseCode: Http.NOT_FOUND,
    }
  );

  test('handles 404 errors gracefully', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    await expect(fetchView(notFoundViewName)).resolves.toBeUndefined();
  });

  const frontEndOnlyView = attachmentView;
  overrideAjax(
    formatUrl('/context/view.json', { name: frontEndOnlyView, quiet: '' }),
    viewDefinition,
    {
      responseCode: Http.NO_CONTENT,
    }
  );

  test('handles 204 response gracefully', async () =>
    expect(fetchView(frontEndOnlyView)).resolves.toBeUndefined());

  const expectedCollectorsView = {
    name: localized('Collectors'),
    class: 'edu.ku.brc.specify.datamodel.Collector',
    defaultSubviewFormType: 'formTable',
    busrules: 'edu.ku.brc.specify.datamodel.busrules.CollectorBusRules',
    altviews: {
      'Collectors Table View': {
        name: 'Collectors Table View',
        viewdef: 'Collectors Table',
        mode: 'view',
      },
      'Collectors Table Edit': {
        name: 'Collectors Table Edit',
        viewdef: 'Collectors Table',
        mode: 'edit',
        default: 'true',
      },
      'Collector View': {
        name: 'Collector View',
        viewdef: 'Collector',
        mode: 'view',
        default: 'true',
      },
      'Collector Edit': {
        name: 'Collector Edit',
        viewdef: 'Collector',
        mode: 'edit',
      },
    },
    viewdefs: {
      'Collectors Table':
        '<viewdef type="formtable" name="Collectors Table" class="edu.ku.brc.specify.datamodel.Collector" gettable="edu.ku.brc.af.ui.forms.DataGetterForObj" settable="edu.ku.brc.af.ui.forms.DataSetterForObj">\n            <desc>Collectors grid view for CollectingEvent form.</desc>\n            <definition>Collectors</definition>\n        </viewdef>\n\n        ',
      Collectors:
        '<viewdef type="form" name="Collectors" class="edu.ku.brc.specify.datamodel.Collector" gettable="edu.ku.brc.af.ui.forms.DataGetterForObj" settable="edu.ku.brc.af.ui.forms.DataSetterForObj">\n            <desc>The Collectors form - UNKNOWN use in database.</desc>\n            <enableRules />\n\n            <columnDef>p,5dlu,p:g,5dlu,p</columnDef>\n            <rowDef auto="true" cell="p" sep="2px" />\n\n            <rows>\n                <row>\n                    <cell type="label" labelfor="3" />\n                    <cell type="field" id="3" name="agent.lastName" uitype="text" colspan="3" />\n                </row>\n                <row>\n                    <cell type="label" labelfor="5" />\n                    <cell type="field" id="5" name="agent.firstName" uitype="text" colspan="3" />\n                </row>\n                <row>\n                    <cell type="label" labelfor="7" />\n                    <cell type="field" id="7" name="remarks" uitype="text" colspan="3" />\n                </row>\n            </rows>\n        </viewdef>\n\n        ',
      Collector:
        '<viewdef type="form" name="Collector" class="edu.ku.brc.specify.datamodel.Collector" gettable="edu.ku.brc.af.ui.forms.DataGetterForObj" settable="edu.ku.brc.af.ui.forms.DataSetterForObj">\n            <desc>The Collector form.</desc>\n            <enableRules />\n\n            <columnDef>105px,2px,210px,5px,100px,2px,98px,300px,p:g</columnDef>\n            <columnDef os="lnx">135px,2px,230px,5px,120px,2px,118px,325px,p:g</columnDef>\n            <columnDef os="mac">130px,2px,215px,5px,140px,2px,138px,395px,p:g</columnDef>\n            <columnDef os="exp">p,2px,p:g,5px:g,p,2px,p:g,p:g(2),p:g</columnDef>\n            <rowDef>p,2dlu,p:g,2dlu,p:g</rowDef>\n\n            <rows>\n                <row>\n                    <cell type="label" labelfor="1" />\n                    <cell type="field" id="1" name="agent" uitype="querycbx" initialize="name=Agent;title=Agent" />\n                </row>\n                <row>\n                    <cell type="label" labelfor="3" />\n                    <cell type="field" id="3" name="remarks" uitype="textareabrief" rows="2" colspan="6" />\n                </row>\n                <!--<row>\n                    <cell type="label" labelfor="9"/>\n                    <cell type="field" id="9" name="createdByAgent" uitype="label" readonly="true"  uifieldformatter="Agent"/>\n                    <cell type="label" labelfor="10"/>\n                    <cell type="field" id="10" name="modifiedByAgent" uitype="label" readonly="true"  uifieldformatter="Agent"/>\n                    <cell type="label" id="divLabel" label=" " initialize="align=right"/>\n                    <cell type="field" id="4" name="divisionCBX" uitype="combobox" ignore="true"/>\n                </row>\n                <row>\n                \t<cell type="field" id="34" uitype="checkbox" name="isPrimary"/>                \t\n                </row>\n                <row>\n                    <cell type="label" labelfor="11"/>\n                    <cell type="field" id="11" name="timestampModified" uitype="label" readonly="true"/>\n                    <cell type="label" labelfor="12"/>\n                    <cell type="field" id="12" name="timestampCreated" uitype="label" readonly="true"/>\n                </row>-->\n            </rows>\n        </viewdef>\n\n        ',
    },
    view: '<view name="Collectors" class="edu.ku.brc.specify.datamodel.Collector" busrules="edu.ku.brc.specify.datamodel.busrules.CollectorBusRules">\n            <desc>The Collectors Subform.</desc>\n            <altviews>\n                <!-- <altview name="Collectors Icon View"  viewdef="CollectorsIconView" mode="view"/>\n                <altview name="Collectors Icon Edit"  viewdef="CollectorsIconView" mode="edit"/>  -->\n                <altview name="Collectors Table View" viewdef="Collectors Table" mode="view" />\n                <altview name="Collectors Table Edit" viewdef="Collectors Table" mode="edit" default="true" />\n            </altviews>\n        </view>\n\n        ',
    viewsetName: 'Common',
    viewsetLevel: 'Common',
    viewsetSource: 'disk',
    viewsetId: null,
    viewsetFile: 'common/common.views.xml',
  };

  test('corrects grid-only default forms', async () =>
    expect(fetchView('Collectors')).resolves.toStrictEqual(
      expectedCollectorsView
    ));
});

test('parseViewDefinition', async () => {
  jest.spyOn(console, 'warn').mockImplementation();
  const result = await parseViewDefinition(
    {
      ...viewDefinition,
      viewdefs: {
        Preparation: tinyFormView,
      },
    },
    'form',
    'view',
    tables.CollectionObject
  )!;
  expect(result).toBeDefined();
  expect(result!.table?.name).toBe(tables.CollectionObject.name);
  expect(removeKey(result!, 'table')).toEqual({
    ...parsedTinyView,
    errors: [],
    name: '',
    mode: 'view',
    formType: 'form',
    viewSetId: undefined,
    rawDefinition: {
      ...viewDefinition,
      viewdefs: {
        Preparation: tinyFormView,
      },
    },
  });
});

test('resolveViewDefinition', () => {
  const result = resolveViewDefinition(viewDefinition, 'form', 'view')!;
  expect(result).toBeDefined();
  expect(result.viewDefinition).toEqual(simpleFormView);
  expect(result.table?.name).toBe(tables.CollectionObject.name);
  expect(result.formType).toBe('form');
  expect(result.mode).toBe('view');
});

test('parseViewDefinitions', () => {
  expect(
    parseViewDefinitions({
      a: `<viewdef />`,
    }).a.outerHTML
  ).toBe(`<viewdef/>`);
});

theories(resolveAltView, [
  {
    in: [altViews, viewDefs, 'form', 'view'],
    out: {
      altView: altViews['Preparation View'],
      viewDefinition: simpleFormView,
    },
  },
  {
    in: [altViews, viewDefs, 'formTable', 'edit'],
    out: {
      altView: altViews['Preparation Table Edit'],
      viewDefinition: xml(formTableView),
    },
  },
]);

test('parseFormTableDefinition', async () =>
  expect(
    parseFormTableDefinition(simpleFormView, tables.CollectionObject)
  ).resolves.toEqual(parsedFormView));

const formTableColumns = [
  { colSpan: 1 },
  { colSpan: 2 },
] as unknown as RA<FormCellDefinition>;
theories(parseFormTableColumns, {
  'reads column definitions': {
    in: [
      xml(`<viewdef>
        <columnDef os="table">p:g,p:g,44px</columnDef>
      </viewdef>`),
      formTableColumns,
    ],
    out: [undefined, 44, undefined],
  },
  'handles case without column definitions': {
    in: [xml('<viewdef />'), formTableColumns],
    out: [undefined, undefined, undefined],
  },
});

describe('parseFormDefinition', () => {
  test('single view definition', async () => {
    jest.spyOn(console, 'warn').mockImplementation();
    await expect(
      parseFormDefinition(
        toSimpleXmlNode(xmlToJson(strictParseXml(tinyFormView))),
        tables.CollectionObject
      )
    ).resolves.toEqual([
      {
        condition: undefined,
        definition: parsedTinyView,
      },
    ]);
  });

  test('conditional view definitions', async () => {
    jest.spyOn(console, 'warn').mockImplementation();
    await expect(
      parseFormDefinition(
        toSimpleXmlNode(xmlToJson(conditionalTinyFormView)),
        tables.CollectionObject
      ).then((formDefinition) =>
        formDefinition.map(({ condition, ...rest }) => ({
          ...rest,
          condition:
            condition === undefined || condition.type !== 'Value'
              ? condition
              : {
                  ...condition,
                  field: condition.field.map((field) => field.name),
                },
        }))
      )
    ).resolves.toEqual([
      {
        condition: undefined,
        definition: parsedTinyView,
      },
      {
        condition: {
          type: 'Value',
          field: ['accession', 'accessionNumber'],
          value: '42',
        },
        definition: parsedConditionalTinyView,
      },
    ]);
  });
});

describe('getColumnDefinitions', () => {
  requireContext();
  test('can customize the column definition source', () =>
    expect(
      getColumnDefinitions(
        toSimpleXmlNode(
          xmlToJson(
            strictParseXml(
              `<viewdef>
            <columnDef os="abc">A</columnDef>
            <columnDef os="${getPref(
              'form.definition.columnSource'
            )}">B</columnDef>
          </viewdef>`
            )
          )
        )
      )
    ).toBe('B'));

  test('fall back to first definition available', () =>
    expect(
      getColumnDefinitions(
        xml(
          `<viewdef>
            <columnDef os="abc">A</columnDef>
            <columnDef os="abc2">B</columnDef>
          </viewdef>`
        )
      )
    ).toBe('A'));

  test('can specify column definition as an attribute', () =>
    expect(getColumnDefinitions(xml('<viewdef colDef="C" />'))).toBe('C'));
});

theories(getColumnDefinition, [
  {
    in: [
      xml(
        `<viewdef>
          <columnDef os="mac">B</columnDef>
          <columnDef os="lnx">A</columnDef>
        </viewdef>`
      ),
      'lnx',
    ],
    out: 'A',
  },
  {
    in: [
      xml(
        `<viewdef>
          <columnDef os="mac">B</columnDef>
          <columnDef os="lnx">A</columnDef>
        </viewdef>`
      ),
      undefined,
    ],
    out: 'B',
  },
]);

const testRows = `
<viewdef>
<rows>
  <row>
    <cell type="label" labelFor="tt" label="test" />
  </row> 
  <row>
    <cell type="field" name=" stationFieldNumber " uiType="text" colSpan="4" align="right" id="tt" />
    <cell type="field" name="collectingTrip.text1" uiType="checkbox" label="2" colSpan="1" align="right" />
  </row> 
  <row>
  </row>
  <row>
    <cell type="subview" id="dt" viewname="Collectors" name="collectors"/>
  </row>
</rows>
</viewdef>`;

test('parseRows', async () => {
  const viewDef = xml(testRows);
  const rowsContainer = viewDef.children.rows[0];
  const rawRows = rowsContainer?.children?.row ?? [];

  await expect(parseRows(rawRows, tables.CollectingEvent)).resolves.toEqual([
    [
      {
        align: 'right',
        ariaLabel: undefined,
        colSpan: 1,
        fieldNames: undefined,
        id: undefined,
        labelForCellId: 'tt',
        text: 'test',
        title: undefined,
        type: 'Label',
        verticalAlign: 'center',
        visible: true,
      },
    ],
    [
      {
        align: 'left',
        ariaLabel: undefined,
        colSpan: 2,
        fieldDefinition: {
          defaultValue: undefined,
          isReadOnly: false,
          max: undefined,
          maxLength: undefined,
          min: undefined,
          minLength: undefined,
          step: undefined,
          type: 'Text',
          whiteSpaceSensitive: false,
        },
        fieldNames: ['stationFieldNumber'],
        id: 'tt',
        isRequired: false,
        type: 'Field',
        verticalAlign: 'center',
        visible: true,
      },
      {
        align: 'left',
        ariaLabel: undefined,
        colSpan: 1,
        fieldDefinition: {
          defaultValue: undefined,
          isReadOnly: false,
          label: '2',
          printOnSave: false,
          type: 'Checkbox',
        },
        fieldNames: ['collectingTrip', 'text1'],
        id: undefined,
        isRequired: false,
        type: 'Field',
        verticalAlign: 'center',
        visible: true,
      },
    ],
    [],
    [
      {
        align: 'left',
        ariaLabel: undefined,
        colSpan: 1,
        fieldNames: ['collectors'],
        formType: 'formTable',
        icon: undefined,
        id: 'dt',
        isButton: false,
        isCollapsed: false,
        sortField: undefined,
        type: 'SubView',
        verticalAlign: 'stretch',
        viewName: 'Collectors',
        visible: true,
      },
    ],
  ]);
});
