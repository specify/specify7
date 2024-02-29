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
import { spAppResourceView } from '../webOnlyViews';

const {
  views,
  parseViewDefinitions,
  resolveAltView,
  parseFormTableDefinition,
  parseFormTableColumns,
  getColumnDefinitions,
  getColumnDefinition,
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
  const viewDefinition = {} as unknown as ViewDefinition;

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
  const secondViewDefinition = {} as unknown as ViewDefinition;
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

  const frontEndOnlyView = spAppResourceView;
  overrideAjax(
    formatUrl('/context/view.json', { name: frontEndOnlyView, quiet: '' }),
    viewDefinition,
    {
      responseCode: Http.NO_CONTENT,
    }
  );

  test('handles 204 response gracefully', async () =>
    expect(fetchView(frontEndOnlyView)).resolves.toBeUndefined());
});

test('parseViewDefinition', () => {
  jest.spyOn(console, 'warn').mockImplementation();
  const result = parseViewDefinition(
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
  expect(result.table?.name).toBe(tables.CollectionObject.name);
  expect(removeKey(result, 'table')).toEqual({
    ...parsedTinyView,
    errors: [],
    name: '',
    mode: 'view',
    formType: 'form',
    viewSetId: undefined,
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

test('parseFormTableDefinition', () =>
  expect(
    parseFormTableDefinition(simpleFormView, tables.CollectionObject)
  ).toEqual(parsedFormView));

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
  test('single view definition', () => {
    jest.spyOn(console, 'warn').mockImplementation();
    expect(
      parseFormDefinition(
        toSimpleXmlNode(xmlToJson(strictParseXml(tinyFormView))),
        tables.CollectionObject
      )
    ).toEqual([
      {
        condition: undefined,
        definition: parsedTinyView,
      },
    ]);
  });

  test('conditional view definitions', () => {
    jest.spyOn(console, 'warn').mockImplementation();
    expect(
      parseFormDefinition(
        toSimpleXmlNode(xmlToJson(conditionalTinyFormView)),
        tables.CollectionObject
      ).map(({ condition, ...rest }) => ({
        ...rest,
        condition:
          condition === undefined || condition.type !== 'Value'
            ? condition
            : {
                ...condition,
                field: condition.field.map((field) => field.name),
              },
      }))
    ).toEqual([
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
