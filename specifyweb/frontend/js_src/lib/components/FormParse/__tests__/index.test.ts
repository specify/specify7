import type { LocalizedString } from 'typesafe-i18n';

import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { Http } from '../../../utils/ajax/definitions';
import type { RA } from '../../../utils/types';
import { ensure } from '../../../utils/types';
import { removeKey } from '../../../utils/utils';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import { schema } from '../../DataModel/schema';
import { getPref } from '../../InitialContext/remotePrefs';
import { formatUrl } from '../../Router/queryString';
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

const formView =
  strictParseXml(`<viewdef type="form" class="edu.ku.brc.specify.datamodel.CollectionObject">
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
  </viewdef>`);

const formTableView = strictParseXml(`<viewdef type="formtable" />`);

const tinyFormView =
  strictParseXml(`<viewdef type="form" class="edu.ku.brc.specify.datamodel.CollectionObject">
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
</viewdef>`);

const baseCell = {
  id: undefined,
  colSpan: 1,
  align: 'left',
  visible: true,
  ariaLabel: undefined,
} as const;

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

const viewDefs = {
  Preparation: formView,
  'Preparation Table': formTableView,
};

const viewDefinition: ViewDefinition = {
  altviews: altViews,
  busrules: '',
  class: '',
  name: '',
  resourcelabels: 'true',
  viewdefs: {
    Preparation: formView.outerHTML,
  },
  viewsetLevel: '',
  viewsetName: '',
  viewsetSource: '',
  viewsetId: null,
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
        Preparation: tinyFormView.outerHTML,
      },
    },
    'form',
    'view'
  )!;
  expect(result).toBeDefined();
  expect(result.model?.name).toBe(schema.models.CollectionObject.name);
  expect(removeKey(result, 'model')).toEqual({
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
  expect(result.viewDefinition.outerHTML).toBe(formView.outerHTML);
  expect(result.model.name).toBe(schema.models.CollectionObject.name);
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
      viewDefinition: formView,
    },
  },
  {
    in: [altViews, viewDefs, 'formTable', 'edit'],
    out: {
      altView: altViews['Preparation Table Edit'],
      viewDefinition: formTableView,
    },
  },
]);

test('parseFormTableDefinition', () =>
  expect(
    parseFormTableDefinition(formView, schema.models.CollectionObject)
  ).toEqual({
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
            step: undefined,
            isReadOnly: false,
            defaultValue: undefined,
          },
          fieldNames: ['catalogNumber'],
          isRequired: false,
          ariaLabel: 'test' as LocalizedString,
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
            defaultValue: false,
            isReadOnly: false,
          },
          fieldNames: ['accession', 'text1'],
          isRequired: false,
          ariaLabel: '2' as LocalizedString,
        },
      ],
    ],
  }));

const formTableColumns = [
  { colSpan: 1 },
  { colSpan: 2 },
] as unknown as RA<FormCellDefinition>;
theories(parseFormTableColumns, {
  'reads column definitions': {
    in: [
      strictParseXml(`<viewdef>
        <columnDef os="table">p:g,p:g,44px</columnDef>
      </viewdef>`),
      formTableColumns,
    ],
    out: [undefined, 44, undefined],
  },
  'handles case without column definitions': {
    in: [strictParseXml('<viewdef />'), formTableColumns],
    out: [undefined, undefined, undefined],
  },
});

test('parseFormDefinition', () => {
  jest.spyOn(console, 'warn').mockImplementation();
  expect(
    parseFormDefinition(tinyFormView, schema.models.CollectionObject)
  ).toEqual(parsedTinyView);
});

describe('getColumnDefinitions', () => {
  requireContext();
  test('can customize the column definition source', () =>
    expect(
      getColumnDefinitions(
        strictParseXml(
          `<viewdef>
            <columnDef os="abc">A</columnDef>
            <columnDef os="${getPref(
              'form.definition.columnSource'
            )}">B</columnDef>
          </viewdef>`
        )
      )
    ).toBe('B'));

  test('fall back to first definition available', () =>
    expect(
      getColumnDefinitions(
        strictParseXml(
          `<viewdef>
            <columnDef os="abc">A</columnDef>
            <columnDef os="abc2">B</columnDef>
          </viewdef>`
        )
      )
    ).toBe('A'));

  test('can specify column definition as an attribute', () =>
    expect(getColumnDefinitions(strictParseXml('<viewdef colDef="C" />'))).toBe(
      'C'
    ));
});

theories(getColumnDefinition, [
  {
    in: [
      strictParseXml(
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
      strictParseXml(
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
