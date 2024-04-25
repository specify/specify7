import { requireContext } from '../../../tests/helpers';
import type { IR } from '../../../utils/types';
import { ensure, localized } from '../../../utils/types';
import { tables } from '../../DataModel/tables';
import type { ViewDefinition } from '../../FormParse';
import { formatXmlForTests } from '../../Syncer/__tests__/utils';
import { jsonToXml } from '../../Syncer/xmlToJson';
import { xmlToString } from '../../Syncer/xmlToString';
import { createViewDefinition, exportsForTests } from '../createView';
import type { ViewSets } from '../spec';

requireContext();

const { tablesWithFormTable } = exportsForTests;

test('Tables with form tables computed correctly', () =>
  expect(tablesWithFormTable()).toMatchSnapshot());

const viewDefinition: ViewDefinition = {
  name: localized('CollectionObjectAttachment'),
  class: 'edu.ku.brc.specify.datamodel.CollectionObjectAttachment',
  busrules: 'edu.ku.brc.specify.datamodel.busrules.AttachmentBusRules',
  resourcelabels: 'false',
  altviews: {},
  viewdefs: {
    'CollectionObjectAttachment IconView': `<viewdef
  type="iconview"
  name="CollectionObjectAttachment IconView"
  class="edu.ku.brc.specify.datamodel.CollectionObjectAttachment"
  gettable="edu.ku.brc.af.ui.forms.DataGetterForObj"
  settable="edu.ku.brc.af.ui.forms.DataSetterForObj">
  <desc><![CDATA[The ObjectAttachment Icon Viewer]]></desc>
</viewdef>`,
    'CollectionObjectAttachment Table': `<viewdef
  type="formtable"
  name="CollectionObjectAttachment Table"
  class="edu.ku.brc.specify.datamodel.CollectionObjectAttachment"
  gettable="edu.ku.brc.af.ui.forms.DataGetterForObj"
  settable="edu.ku.brc.af.ui.forms.DataSetterForObj">
  <desc><![CDATA[ObjectAttachment grid view.]]></desc>
  <definition>ObjectAttachment Form</definition>
</viewdef>`,
    'CollectionObjectAttachment Form': `<viewdef
  type="form"
  name="CollectionObjectAttachment Form"
  class="edu.ku.brc.specify.datamodel.CollectionObjectAttachment"
  gettable="edu.ku.brc.af.ui.forms.DataGetterForObj"
  settable="edu.ku.brc.af.ui.forms.DataSetterForObj"
  useresourcelabels="true">
  <desc><![CDATA[The CollectionObjectAttachment form.]]></desc>
  <!-- <columnDef>110px,2dlu,p:g,5dlu,100px,2dlu,85px</columnDef> -->
  <columnDef>p,5dlu,p:g</columnDef>
  <rowDef auto="true" cell="p" sep="2px"/>
  <rows />
</viewdef>`,
    'ObjectAttachment Form': `<viewdef type="form" name="ObjectAttachment Form" class="edu.ku.brc.specify.datamodel.ObjectAttachmentIFace" gettable="edu.ku.brc.af.ui.forms.DataGetterForObj" settable="edu.ku.brc.af.ui.forms.DataSetterForObj" useresourcelabels="true">
  <desc>The ObjectAttachment form.</desc>
  <columnDef>p,2px,p:g</columnDef>
  <rowDef auto="true" cell="p" sep="2px" />
  <rows />
</viewdef>`,
  },
  view: `<view name="CollectionObjectAttachment" class="edu.ku.brc.specify.datamodel.CollectionObjectAttachment" busrules="edu.ku.brc.specify.datamodel.busrules.AttachmentBusRules" resourcelabels="false">
  <desc>The Collection Object-Attachment View.</desc>
  <altviews>
    <altview name="CollectionObjectAttachment Icon View" viewdef="CollectionObjectAttachment IconView" mode="view" />
    <altview name="CollectionObjectAttachment Icon Edit" viewdef="CollectionObjectAttachment IconView" mode="edit" />
    <altview name="CollectionObjectAttachment Table View" viewdef="CollectionObjectAttachment Table" mode="view" />
    <altview name="CollectionObjectAttachment Table Edit" viewdef="CollectionObjectAttachment Table" mode="edit" />
    <altview name="CollectionObjectAttachment Form View" viewdef="CollectionObjectAttachment Form" label="Form" mode="view" default="true" />
    <altview name="CollectionObjectAttachment Form Edit" viewdef="CollectionObjectAttachment Form" label="Form" mode="edit" />
  </altviews>
</view>`,
  viewsetName: 'Global',
  viewsetLevel: 'Backstop',
  viewsetSource: 'disk',
  viewsetId: null,
  viewsetFile: 'backstop/global.views.xml',
};

const viewSets = (): ViewSets =>
  ensure<ViewSets>()({
    views: [
      {
        name: localized('CollectionObjectAttachment'),
        description: 'The Collection Object-Attachment View.',
        businessRules: localized(
          'edu.ku.brc.specify.datamodel.busrules.AttachmentBusRules'
        ),
        legacyIsInternal: undefined,
        legacyIsExternal: undefined,
        legacyTable: undefined,
        title: localized(''),
        altViews: {
          legacyDefaultMode: undefined,
          legacySelector: undefined,
          altViews: [
            {
              name: 'CollectionObjectAttachment Icon View',
              viewDef: localized('CollectionObjectAttachment IconView'),
              mode: 'view',
              default: false,
              legacyTitle: undefined,
              legacyLabel: undefined,
              legacyValidated: undefined,
              legacySelectorValue: undefined,
            },
            {
              name: 'CollectionObjectAttachment Icon Edit',
              viewDef: localized('CollectionObjectAttachment IconView'),
              mode: 'edit',
              default: false,
              legacyTitle: undefined,
              legacyLabel: undefined,
              legacyValidated: undefined,
              legacySelectorValue: undefined,
            },
            {
              name: 'CollectionObjectAttachment Table View',
              viewDef: localized('CollectionObjectAttachment Table'),
              mode: 'view',
              default: false,
              legacyTitle: undefined,
              legacyLabel: undefined,
              legacyValidated: undefined,
              legacySelectorValue: undefined,
            },
            {
              name: 'CollectionObjectAttachment Table Edit',
              viewDef: localized('CollectionObjectAttachment Table'),
              mode: 'edit',
              default: false,
              legacyTitle: undefined,
              legacyLabel: undefined,
              legacyValidated: undefined,
              legacySelectorValue: undefined,
            },
            {
              name: 'CollectionObjectAttachment Form View',
              viewDef: localized('CollectionObjectAttachment Form'),
              mode: 'view',
              default: true,
              legacyTitle: undefined,
              legacyLabel: localized('Form'),
              legacyValidated: undefined,
              legacySelectorValue: undefined,
            },
            {
              name: 'CollectionObjectAttachment Form Edit',
              viewDef: localized('CollectionObjectAttachment Form'),
              mode: 'edit',
              default: false,
              legacyTitle: undefined,
              legacyLabel: localized('Form'),
              legacyValidated: undefined,
              legacySelectorValue: undefined,
            },
          ],
        },
        legacyUseBusinessRules: true,
        legacyResourceLabels: false,
        table: tables.CollectionObjectAttachment,
      },
    ],
    viewDefs: [
      {
        name: localized('CollectionObjectAttachment Table'),
        type: 'formtable',
        legacyGetTable: localized('edu.ku.brc.af.ui.forms.DataGetterForObj'),
        legacySetTable: localized('edu.ku.brc.af.ui.forms.DataSetterForObj'),
        legacyEditableDialog: true,
        legacyUseResourceLabels: undefined,
        raw: {
          type: 'XmlNode',
          tagName: 'viewdef',
          attributes: {},
          children: [],
        },
        table: tables.CollectionObjectAttachment,
        legacyTable: undefined,
      },
      {
        name: localized('CollectionObjectAttachment Form'),
        type: 'form',
        legacyGetTable: localized('edu.ku.brc.af.ui.forms.DataGetterForObj'),
        legacySetTable: localized('edu.ku.brc.af.ui.forms.DataSetterForObj'),
        legacyEditableDialog: true,
        legacyUseResourceLabels: true,
        raw: {
          type: 'XmlNode',
          tagName: 'viewdef',
          attributes: {},
          children: [],
        },
        table: tables.CollectionObjectAttachment,
        legacyTable: undefined,
      },
      {
        name: localized('CollectionObjectAttachment IconView'),
        type: 'iconview',
        legacyGetTable: localized('edu.ku.brc.af.ui.forms.DataGetterForObj'),
        legacySetTable: localized('edu.ku.brc.af.ui.forms.DataSetterForObj'),
        legacyEditableDialog: true,
        legacyUseResourceLabels: undefined,
        raw: {
          type: 'XmlNode',
          tagName: 'viewdef',
          attributes: {},
          children: [],
        },
        table: tables.CollectionObjectAttachment,
        legacyTable: undefined,
      },
      {
        name: localized('ObjectAttachment Form'),
        type: 'form',
        legacyGetTable: localized('edu.ku.brc.af.ui.forms.DataGetterForObj'),
        legacySetTable: localized('edu.ku.brc.af.ui.forms.DataSetterForObj'),
        legacyEditableDialog: true,
        legacyUseResourceLabels: true,
        raw: {
          type: 'XmlNode',
          tagName: 'viewdef',
          attributes: {},
          children: [],
        },
        table: undefined,
        legacyTable: 'edu.ku.brc.specify.datamodel.ObjectAttachmentIFace',
      },
    ],
    name: viewDefinition.name,
  });

/** Reformat the result to reduce snapshot size and make it more readable */
const processViewSet = (viewSet: ViewSets): IR<unknown> =>
  // Get rid of symbols
  JSON.parse(
    JSON.stringify({
      ...viewSet,
      viewDefs: viewSet.viewDefs.map(({ raw, ...rest }) => ({
        ...rest,
        raw: formatXmlForTests(
          xmlToString(jsonToXml({ ...raw, attributes: {} }), false)
        ),
      })),
    })
  );

test('Create new view definition', () =>
  expect(
    processViewSet(
      createViewDefinition(
        viewSets(),
        localized('CollectionObjectAttachment_2'),
        tables.CollectionObjectAttachment,
        'new'
      )
    )
  ).toEqual({
    viewDefs: [
      {
        legacyEditableDialog: true,
        legacyGetTable: 'edu.ku.brc.af.ui.forms.DataGetterForObj',
        legacySetTable: 'edu.ku.brc.af.ui.forms.DataSetterForObj',
        name: 'CollectionObjectAttachment Table',
        raw: '<viewdef/>',
        table: '[table CollectionObjectAttachment]',
        type: 'formtable',
      },
      {
        legacyEditableDialog: true,
        legacyGetTable: 'edu.ku.brc.af.ui.forms.DataGetterForObj',
        legacySetTable: 'edu.ku.brc.af.ui.forms.DataSetterForObj',
        legacyUseResourceLabels: true,
        name: 'CollectionObjectAttachment Form',
        raw: '<viewdef/>',
        table: '[table CollectionObjectAttachment]',
        type: 'form',
      },
      {
        legacyEditableDialog: true,
        legacyGetTable: 'edu.ku.brc.af.ui.forms.DataGetterForObj',
        legacySetTable: 'edu.ku.brc.af.ui.forms.DataSetterForObj',
        name: 'CollectionObjectAttachment IconView',
        raw: '<viewdef/>',
        table: '[table CollectionObjectAttachment]',
        type: 'iconview',
      },
      {
        legacyEditableDialog: true,
        legacyGetTable: 'edu.ku.brc.af.ui.forms.DataGetterForObj',
        legacySetTable: 'edu.ku.brc.af.ui.forms.DataSetterForObj',
        legacyTable: 'edu.ku.brc.specify.datamodel.ObjectAttachmentIFace',
        legacyUseResourceLabels: true,
        name: 'ObjectAttachment Form',
        raw: '<viewdef/>',
        type: 'form',
      },
      {
        legacyEditableDialog: true,
        name: 'CollectionObjectAttachment_2',
        raw: "<viewdef>\n  <desc>The CollectionObjectAttachment Table</desc>\n  <enableRules/>\n  <columnDef>p,2px,p,2px,p,2px,p,2px,p,2px,p,p:g</columnDef>\n  <rowDef auto='true' cell='p' sep='2px'/>\n  <rows>\n    <row/>\n  </rows>\n</viewdef>",
        table: '[table CollectionObjectAttachment]',
        type: 'form',
      },
      {
        legacyEditableDialog: true,
        name: 'CollectionObjectAttachment_2 Icon',
        raw: '<viewdef>\n  <desc>The Attachments Icon Viewer</desc>\n</viewdef>',
        table: '[table CollectionObjectAttachment]',
        type: 'iconview',
      },
      {
        legacyEditableDialog: true,
        name: 'CollectionObjectAttachment_2 Table',
        raw: '<viewdef>\n  <desc>The CollectionObjectAttachment Table</desc>\n  <definition>CollectionObjectAttachment_2</definition>\n</viewdef>',
        table: '[table CollectionObjectAttachment]',
        type: 'formtable',
      },
    ],
    views: [
      {
        altViews: {
          altViews: [
            {
              default: false,
              mode: 'view',
              name: 'CollectionObjectAttachment Icon View',
              viewDef: 'CollectionObjectAttachment IconView',
            },
            {
              default: false,
              mode: 'edit',
              name: 'CollectionObjectAttachment Icon Edit',
              viewDef: 'CollectionObjectAttachment IconView',
            },
            {
              default: false,
              mode: 'view',
              name: 'CollectionObjectAttachment Table View',
              viewDef: 'CollectionObjectAttachment Table',
            },
            {
              default: false,
              mode: 'edit',
              name: 'CollectionObjectAttachment Table Edit',
              viewDef: 'CollectionObjectAttachment Table',
            },
            {
              default: true,
              legacyLabel: 'Form',
              mode: 'view',
              name: 'CollectionObjectAttachment Form View',
              viewDef: 'CollectionObjectAttachment Form',
            },
            {
              default: false,
              legacyLabel: 'Form',
              mode: 'edit',
              name: 'CollectionObjectAttachment Form Edit',
              viewDef: 'CollectionObjectAttachment Form',
            },
          ],
        },
        description: 'The Collection Object-Attachment View.',
        businessRules:
          'edu.ku.brc.specify.datamodel.busrules.AttachmentBusRules',
        legacyResourceLabels: false,
        legacyUseBusinessRules: true,
        name: 'CollectionObjectAttachment',
        table: '[table CollectionObjectAttachment]',
        title: '',
      },
      {
        altViews: {
          altViews: [
            {
              default: false,
              legacyValidated: false,
              mode: 'view',
              name: 'CollectionObjectAttachment_2 View',
              viewDef: 'CollectionObjectAttachment_2',
            },
            {
              default: true,
              legacyValidated: false,
              mode: 'edit',
              name: 'CollectionObjectAttachment_2 Edit',
              viewDef: 'CollectionObjectAttachment_2',
            },
            {
              default: false,
              legacyValidated: false,
              mode: 'view',
              name: 'CollectionObjectAttachment_2 Table View',
              viewDef: 'CollectionObjectAttachment_2 Table',
            },
            {
              default: false,
              legacyValidated: false,
              mode: 'edit',
              name: 'CollectionObjectAttachment_2 Table Edit',
              viewDef: 'CollectionObjectAttachment_2 Table',
            },
            {
              default: false,
              legacyValidated: false,
              mode: 'view',
              name: 'CollectionObjectAttachment_2 Icon View',
              viewDef: 'CollectionObjectAttachment_2 Icon',
            },
            {
              default: false,
              legacyValidated: false,
              mode: 'edit',
              name: 'CollectionObjectAttachment_2 Icon Edit',
              viewDef: 'CollectionObjectAttachment_2 Icon',
            },
          ],
        },
        description: '',
        businessRules:
          'edu.ku.brc.specify.datamodel.busrules.AttachmentBusRules',
        legacyUseBusinessRules: true,
        name: 'CollectionObjectAttachment_2',
        table: '[table CollectionObjectAttachment]',
        title: 'CollectionObjectAttachment',
      },
    ],
    name: 'CollectionObjectAttachment',
  }));

test('Add new view definition based on existing', () =>
  expect(
    processViewSet(
      createViewDefinition(
        viewSets(),
        localized('A'),
        tables.Accession,
        viewDefinition
      )
    )
  ).toEqual({
    viewDefs: [
      {
        legacyEditableDialog: true,
        legacyGetTable: 'edu.ku.brc.af.ui.forms.DataGetterForObj',
        legacySetTable: 'edu.ku.brc.af.ui.forms.DataSetterForObj',
        name: 'CollectionObjectAttachment Table',
        raw: '<viewdef/>',
        table: '[table CollectionObjectAttachment]',
        type: 'formtable',
      },
      {
        legacyEditableDialog: true,
        legacyGetTable: 'edu.ku.brc.af.ui.forms.DataGetterForObj',
        legacySetTable: 'edu.ku.brc.af.ui.forms.DataSetterForObj',
        legacyUseResourceLabels: true,
        name: 'CollectionObjectAttachment Form',
        raw: '<viewdef/>',
        table: '[table CollectionObjectAttachment]',
        type: 'form',
      },
      {
        legacyEditableDialog: true,
        legacyGetTable: 'edu.ku.brc.af.ui.forms.DataGetterForObj',
        legacySetTable: 'edu.ku.brc.af.ui.forms.DataSetterForObj',
        name: 'CollectionObjectAttachment IconView',
        raw: '<viewdef/>',
        table: '[table CollectionObjectAttachment]',
        type: 'iconview',
      },
      {
        legacyEditableDialog: true,
        legacyGetTable: 'edu.ku.brc.af.ui.forms.DataGetterForObj',
        legacySetTable: 'edu.ku.brc.af.ui.forms.DataSetterForObj',
        legacyTable: 'edu.ku.brc.specify.datamodel.ObjectAttachmentIFace',
        legacyUseResourceLabels: true,
        name: 'ObjectAttachment Form',
        raw: '<viewdef/>',
        type: 'form',
      },
      {
        legacyEditableDialog: true,
        legacyGetTable: 'edu.ku.brc.af.ui.forms.DataGetterForObj',
        legacySetTable: 'edu.ku.brc.af.ui.forms.DataSetterForObj',
        name: 'CollectionObjectAttachment IconView (2)',
        raw: `<viewdef>
  <desc>The ObjectAttachment Icon Viewer</desc>
</viewdef>`,
        table: '[table CollectionObjectAttachment]',
        type: 'iconview',
      },
      {
        legacyEditableDialog: true,
        legacyGetTable: 'edu.ku.brc.af.ui.forms.DataGetterForObj',
        legacySetTable: 'edu.ku.brc.af.ui.forms.DataSetterForObj',
        name: 'CollectionObjectAttachment Table (2)',
        raw: `<viewdef>
  <desc>ObjectAttachment grid view.</desc>
  <definition>ObjectAttachment Form</definition>
</viewdef>`,
        table: '[table CollectionObjectAttachment]',
        type: 'formtable',
      },
      {
        legacyEditableDialog: true,
        legacyGetTable: 'edu.ku.brc.af.ui.forms.DataGetterForObj',
        legacySetTable: 'edu.ku.brc.af.ui.forms.DataSetterForObj',
        legacyUseResourceLabels: true,
        name: 'CollectionObjectAttachment Form (2)',
        raw: `<viewdef>
  <desc>The CollectionObjectAttachment form.</desc>
  <!-- <columnDef>110px,2dlu,p:g,5dlu,100px,2dlu,85px</columnDef> -->
  <columnDef>p,5dlu,p:g</columnDef>
  <rowDef auto='true' cell='p' sep='2px'/>
  <rows/>
</viewdef>`,
        table: '[table CollectionObjectAttachment]',
        type: 'form',
      },
    ],
    views: [
      {
        altViews: {
          altViews: [
            {
              default: false,
              mode: 'view',
              name: 'CollectionObjectAttachment Icon View',
              viewDef: 'CollectionObjectAttachment IconView',
            },
            {
              default: false,
              mode: 'edit',
              name: 'CollectionObjectAttachment Icon Edit',
              viewDef: 'CollectionObjectAttachment IconView',
            },
            {
              default: false,
              mode: 'view',
              name: 'CollectionObjectAttachment Table View',
              viewDef: 'CollectionObjectAttachment Table',
            },
            {
              default: false,
              mode: 'edit',
              name: 'CollectionObjectAttachment Table Edit',
              viewDef: 'CollectionObjectAttachment Table',
            },
            {
              default: true,
              legacyLabel: 'Form',
              mode: 'view',
              name: 'CollectionObjectAttachment Form View',
              viewDef: 'CollectionObjectAttachment Form',
            },
            {
              default: false,
              legacyLabel: 'Form',
              mode: 'edit',
              name: 'CollectionObjectAttachment Form Edit',
              viewDef: 'CollectionObjectAttachment Form',
            },
          ],
        },
        description: 'The Collection Object-Attachment View.',
        businessRules:
          'edu.ku.brc.specify.datamodel.busrules.AttachmentBusRules',
        legacyResourceLabels: false,
        legacyUseBusinessRules: true,
        name: 'CollectionObjectAttachment',
        table: '[table CollectionObjectAttachment]',
        title: '',
      },
      {
        altViews: {
          altViews: [
            {
              default: false,
              mode: 'view',
              name: 'CollectionObjectAttachment Icon View',
              viewDef: 'CollectionObjectAttachment IconView (2)',
            },
            {
              default: false,
              mode: 'edit',
              name: 'CollectionObjectAttachment Icon Edit',
              viewDef: 'CollectionObjectAttachment IconView (2)',
            },
            {
              default: false,
              mode: 'view',
              name: 'CollectionObjectAttachment Table View',
              viewDef: 'CollectionObjectAttachment Table (2)',
            },
            {
              default: false,
              mode: 'edit',
              name: 'CollectionObjectAttachment Table Edit',
              viewDef: 'CollectionObjectAttachment Table (2)',
            },
            {
              default: true,
              legacyLabel: 'Form',
              mode: 'view',
              name: 'CollectionObjectAttachment Form View',
              viewDef: 'CollectionObjectAttachment Form (2)',
            },
            {
              default: false,
              legacyLabel: 'Form',
              mode: 'edit',
              name: 'CollectionObjectAttachment Form Edit',
              viewDef: 'CollectionObjectAttachment Form (2)',
            },
          ],
        },
        description: 'The Collection Object-Attachment View.',
        businessRules:
          'edu.ku.brc.specify.datamodel.busrules.AttachmentBusRules',
        legacyResourceLabels: false,
        legacyUseBusinessRules: true,
        name: 'A',
        table: '[table CollectionObjectAttachment]',
      },
    ],
    name: 'CollectionObjectAttachment',
  }));
