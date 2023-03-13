import type { LocalizedString } from 'typesafe-i18n';

import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import type { PartialBy } from '../../../utils/types';
import { strictParseXml } from '../../AppResources/codeMirrorLinters';
import type { CellTypes, FormCellDefinition } from '../cells';
import {
  parseFormCell,
  parseSpecifyProperties,
  processColumnDefinition,
} from '../cells';
import { tables } from '../../DataModel/tables';
import {
  SimpleXmlNode,
  toSimpleXmlNode,
  xmlToJson,
} from '../../Syncer/xmlToJson';

requireContext();

theories(processColumnDefinition, [
  {
    in: ['100px,2px,195px,5px,86px,2px,210px,5px,74px,2px,146px,15px,p:g'],
    out: [100, 195, 86, 210, 74, 146],
  },
  {
    in: [
      'p,2px,min(p;150px),5px:g,p,2px,p:g(2),5px:g,p,2px,p:g(2),5px:g,p,2px,p:g(2)',
    ],
    out: [
      undefined,
      150,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ],
  },
  {
    in: ['p,2px,p:g,5px:g,p,2px,p:g(2),5px:g,p,2px,p:g(2)'],
    out: [undefined, undefined, undefined, undefined, undefined, undefined],
  },
  { in: ['130px,2px,705px,25px,95px,0px,p:g'], out: [130, 705, 95] },
  { in: ['p,2px,p:g(4),p:g,p,0px'], out: [undefined, undefined, undefined] },
]);

theories(parseSpecifyProperties, [
  {
    in: [''],
    out: {},
  },
  {
    in: ['name=Agent;title=Catalog Agent'],
    out: {
      name: 'Agent',
      title: 'Catalog Agent',
    },
  },
  {
    in: ['name=PartialDateUI;df=catalogedDate;tp=catalogedDatePrecision'],
    out: {
      name: 'PartialDateUI',
      df: 'catalogedDate',
      tp: 'catalogedDatePrecision',
    },
  },
  {
    in: ['name=CollectingEvent;clonebtn=true'],
    out: {
      name: 'CollectingEvent',
      clonebtn: 'true',
    },
  },
  {
    in: ['align=left;'],
    out: {
      align: 'left',
    },
  },
  {
    in: ['align=right;fg=0,190,0'],
    out: {
      align: 'right',
      fg: '0,190,0',
    },
  },
  {
    in: [
      'name=LocalityGeoRef;title=Geo Ref;geoid=geography;locid=localityName;llid=5',
    ],
    out: {
      name: 'LocalityGeoRef',
      title: 'Geo Ref',
      geoid: 'geography',
      locid: 'localityName',
      llid: '5',
    },
  },
]);

const cell = (
  cell: CellTypes[keyof CellTypes] &
    PartialBy<
      FormCellDefinition,
      'align' | 'ariaLabel' | 'colSpan' | 'id' | 'visible'
    >
): FormCellDefinition => ({
  id: undefined,
  colSpan: 1,
  align: 'left',
  visible: true,
  ariaLabel: undefined,
  ...cell,
});

const xml = (xml: string): SimpleXmlNode =>
  toSimpleXmlNode(xmlToJson(strictParseXml(xml)));

describe('parseFormCell', () => {
  test('base case', () => {
    jest.spyOn(console, 'warn').mockImplementation();
    expect(parseFormCell(tables.CollectionObject, xml('<cell />'))).toEqual(
      cell({
        type: 'Unsupported',
        cellType: undefined,
      })
    );
  });

  test('unsupported cell with some attributes', () => {
    jest.spyOn(console, 'warn').mockImplementation();
    expect(
      parseFormCell(
        tables.CollectionObject,
        xml(
          '<cell invisible="true" type=" test2 " initialize="align=Center" colSpan=" 5 " id="test" />'
        )
      )
    ).toEqual(
      cell({
        id: 'test',
        colSpan: 3,
        align: 'center',
        // Cannot make "Unsupported" cell invisible
        visible: true,
        type: 'Unsupported',
        cellType: ' test2 ',
      })
    );
  });

  test('invisible field', () =>
    expect(
      parseFormCell(
        tables.CollectionObject,
        xml(
          '<cell type=" field " uiType="text" invisible="true" name="CatalogNumber" isRequired="TRuE " initialize="align=RIGHT" colSpan=" 5 " id="test" />'
        )
      )
    ).toEqual(
      cell({
        id: 'test',
        colSpan: 3,
        align: 'right',
        visible: false,
        type: 'Field',
        fieldNames: ['catalogNumber'],
        isRequired: true,
        fieldDefinition: {
          defaultValue: undefined,
          isReadOnly: false,
          max: undefined,
          min: undefined,
          step: undefined,
          type: 'Text',
          maxLength: undefined,
          minLength: undefined,
        },
      })
    ));

  test('field required by schema', () =>
    expect(
      parseFormCell(
        tables.CollectionObject,
        xml(
          '<cell type="field" uiType="text" name="  CollectionObject.CollectionMemberId  " />'
        )
      )
    ).toEqual(
      cell({
        type: 'Field',
        isRequired: true,
        fieldNames: ['collectionMemberId'],
        fieldDefinition: {
          defaultValue: undefined,
          isReadOnly: false,
          max: undefined,
          min: undefined,
          step: undefined,
          type: 'Text',
          maxLength: undefined,
          minLength: undefined,
        },
      })
    ));

  test('unknown field', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(
      parseFormCell(
        tables.CollectionObject,
        xml('<cell type="field" uiType="text" name="this" />')
      )
    ).toEqual(
      cell({
        type: 'Blank',
      })
    );
  });

  test('unknown field with default value', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(
      parseFormCell(
        tables.CollectionObject,
        xml('<cell type="field" uiType="text" name="this" default="A" />')
      )
    ).toEqual(
      cell({
        type: 'Field',
        isRequired: false,
        fieldNames: undefined,
        fieldDefinition: {
          defaultValue: 'A',
          isReadOnly: false,
          max: undefined,
          min: undefined,
          step: undefined,
          type: 'Text',
          maxLength: undefined,
          minLength: undefined,
        },
      })
    );
  });

  test('relationship field names are parsed correctly', () =>
    expect(
      parseFormCell(
        tables.Collector,
        xml('<cell type="field" uiType="text" name="agent.lastName" />')
      )
    ).toEqual(
      cell({
        type: 'Field',
        // The field is required by the data model
        isRequired: false,
        fieldNames: ['agent', 'lastName'],
        fieldDefinition: {
          defaultValue: undefined,
          isReadOnly: false,
          max: undefined,
          min: undefined,
          step: undefined,
          type: 'Text',
          minLength: undefined,
          maxLength: undefined,
        },
      })
    ));

  test('fieldName overwritten by the PartialDateUI plugin', () =>
    expect(
      parseFormCell(
        tables.CollectionObject,
        xml(
          '<cell type="field" uiType="plugin" initialize="name=PartialDateUI;df=catalogedDate" />'
        )
      )
    ).toEqual(
      cell({
        type: 'Field',
        isRequired: false,
        fieldNames: ['catalogedDate'],
        fieldDefinition: {
          type: 'Plugin',
          isReadOnly: false,
          pluginDefinition: {
            type: 'PartialDateUI',
            defaultValue: undefined,
            dateFields: ['catalogedDate'],
            canChangePrecision: true,
            precisionField: undefined,
            defaultPrecision: 'full',
          },
        },
      })
    ));

  test('simple label with custom text', () =>
    expect(
      parseFormCell(
        tables.CollectionObject,
        xml('<cell type="Label" label="some text" />')
      )
    ).toEqual(
      cell({
        // Labels are right aligned by default
        align: 'right',
        type: 'Label',
        text: 'some text' as LocalizedString,
        title: undefined,
        labelForCellId: undefined,
        fieldNames: undefined,
      })
    ));

  test('label with Specify 6 localization string', () =>
    expect(
      parseFormCell(
        tables.CollectionObject,
        xml('<cell type="Label" label="FINDNEXT" labelfor=" 42" />')
      )
    ).toEqual(
      cell({
        align: 'right',
        type: 'Label',
        text: 'Find Next' as LocalizedString,
        title: undefined,
        labelForCellId: '42',
        fieldNames: undefined,
      })
    ));

  test('Separator', () =>
    expect(
      parseFormCell(
        tables.CollectionObject,
        xml(
          '<cell type="separator"   label="FINDNEXT" name="unused" additional="unused" icon=" 42" forClass=" CollectionObject" />'
        )
      )
    ).toEqual(
      cell({
        type: 'Separator',
        label: 'Find Next' as LocalizedString,
        icon: '42',
        forClass: 'CollectionObject',
      })
    ));

  test('basic SubView', () =>
    expect(
      parseFormCell(
        tables.CollectionObject,
        xml('<cell type="subView" name="determinationS "  />')
      )
    ).toEqual(
      cell({
        type: 'SubView',
        formType: 'form',
        fieldNames: ['determinations'],
        viewName: undefined,
        isButton: false,
        icon: undefined,
        sortField: undefined,
      })
    ));

  test('SubView button with custom icon and sorting', () =>
    expect(
      parseFormCell(
        tables.CollectionObject,
        xml(
          '<cell type="subView" name="determinations" defaultType="table" viewName="testView " initialize="sortField=-iscurrent ;btn=true  ; icon=test" />'
        )
      )
    ).toEqual(
      cell({
        type: 'SubView',
        formType: 'formTable',
        fieldNames: ['determinations'],
        viewName: 'testView',
        isButton: true,
        icon: 'test',
        sortField: { fieldNames: ['isCurrent'], direction: 'desc' },
      })
    ));

  test('Panel', () =>
    expect(
      parseFormCell(
        tables.CollectionObject,
        xml(
          `<cell type="panel" colDef="1px,2px,2px">
            <rows>
              <row>
                <cell type="Label" label="FINDNEXT" labelfor=" 42" />
              </row>
            </rows>
          </cell>`
        )
      )
    ).toEqual(
      cell({
        type: 'Panel',
        columns: [1, 2],
        align: 'left',
        rows: [
          [
            cell({
              align: 'right',
              labelForCellId: '42',
              type: 'Label',
              fieldNames: undefined,
              text: 'Find Next' as LocalizedString,
              title: undefined,
            }),
            cell({
              type: 'Blank',
              visible: false,
            }),
          ],
        ],
        display: 'block',
      })
    ));

  test('inline Panel', () =>
    expect(
      parseFormCell(
        tables.CollectionObject,
        xml(
          '<cell type="panel" colDef="p:g,2px,2px" panelType="buttonBar"><rows /></cell>'
        )
      )
    ).toEqual(
      cell({
        type: 'Panel',
        columns: [undefined, 2],
        rows: [],
        display: 'inline',
      })
    ));

  test('Command', () =>
    expect(
      parseFormCell(
        tables.Loan,
        xml(
          '<cell type="command" name="ReturnLoan" label="generateLabelBtn" />'
        )
      )
    ).toEqual(
      cell({
        type: 'Command',
        commandDefinition: {
          commandDefinition: {
            type: 'ReturnLoan',
          },
          label: 'generateLabelBtn' as LocalizedString,
        },
      })
    ));

  test('Blank', () =>
    expect(
      parseFormCell(
        tables.CollectionObject,
        xml('<cell type="blank" name="ignored" />')
      )
    ).toEqual(cell({ type: 'Blank' })));
});
