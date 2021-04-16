import dataModelStorage from '../wbplanviewmodel';
import * as WbPlanViewModelHelper from '../wbplanviewmodelhelper';
import type { MappingsTree } from '../wbplanviewtreehelper';
import mappingsTree1 from './fixtures/mappingstree.1.json';
import { loadDataModel, runTest } from './testmain';

export default function (): void {
  loadDataModel();

  runTest(
    'WbPlanViewModelHelper.getTableNonRelationshipFields',
    [
      [
        ['collectionobject', false],
        [
          [
            'altcatalognumber',
            {
              friendlyName: 'Alt Cat Number',
              isHidden: false,
              isRequired: false,
              isRelationship: false,
            },
          ],
          [
            'catalognumber',
            {
              friendlyName: 'Catalog Number',
              isHidden: false,
              isRequired: false,
              isRelationship: false,
            },
          ],
          [
            'catalogeddate',
            {
              friendlyName: 'Cataloged Date',
              isHidden: false,
              isRequired: false,
              isRelationship: false,
            },
          ],
          [
            'guid',
            {
              friendlyName: 'GUID',
              isHidden: false,
              isRequired: false,
              isRelationship: false,
            },
          ],
          [
            'projectnumber',
            {
              friendlyName: 'Project Number',
              isHidden: false,
              isRequired: false,
              isRelationship: false,
            },
          ],
        ],
      ],
    ],
    WbPlanViewModelHelper.getTableNonRelationshipFields
  );

  runTest(
    'WbPlanViewModelHelper.getTableRelationships',
    [
      [
        ['collectionobject', true],
        [
          [
            'agent1',
            {
              friendlyName: 'Agent1',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'agent',
              type: 'many-to-one',
            },
          ],
          [
            'appraisal',
            {
              friendlyName: 'Appraisal',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'appraisal',
              type: 'many-to-one',
              foreignName: 'collectionobjects',
            },
          ],
          [
            'collectionobjectcitations',
            {
              friendlyName: 'Collection Object Citations',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'collectionobjectcitation',
              type: 'one-to-many',
              foreignName: 'collectionobject',
            },
          ],
          [
            'collectionobjectproperties',
            {
              friendlyName: 'Collection Object Properties',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'collectionobjectproperty',
              type: 'one-to-many',
              foreignName: 'collectionobject',
            },
          ],
          [
            'conservdescriptions',
            {
              friendlyName: 'Conserv Descriptions',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'conservdescription',
              type: 'one-to-many',
              foreignName: 'collectionobject',
            },
          ],
          [
            'container',
            {
              friendlyName: 'Container',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'container',
              type: 'many-to-one',
              foreignName: 'collectionobjects',
            },
          ],
          [
            'containerowner',
            {
              friendlyName: 'Container Owner',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'container',
              type: 'many-to-one',
              foreignName: 'collectionobjectkids',
            },
          ],
          [
            'createdbyagent',
            {
              friendlyName: 'Created By Agent',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'agent',
              type: 'many-to-one',
            },
          ],
          [
            'dnasequences',
            {
              friendlyName: 'DNA Sequences',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'dnasequence',
              type: 'one-to-many',
              foreignName: 'collectionobject',
            },
          ],
          [
            'exsiccataitems',
            {
              friendlyName: 'Exsiccata Items',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'exsiccataitem',
              type: 'one-to-many',
              foreignName: 'collectionobject',
            },
          ],
          [
            'fieldnotebookpage',
            {
              friendlyName: 'Field Notebook Page',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'fieldnotebookpage',
              type: 'many-to-one',
              foreignName: 'collectionobjects',
            },
          ],
          [
            'inventorizedby',
            {
              friendlyName: 'Inventoried By',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'agent',
              type: 'many-to-one',
            },
          ],
          [
            'modifiedbyagent',
            {
              friendlyName: 'Modified By Agent',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'agent',
              type: 'many-to-one',
            },
          ],
          [
            'paleocontext',
            {
              friendlyName: 'Paleo Context',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'paleocontext',
              type: 'many-to-one',
              foreignName: 'collectionobjects',
            },
          ],
          [
            'projects',
            {
              friendlyName: 'Projects',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'project',
              type: 'many-to-many',
              foreignName: 'collectionobjects',
            },
          ],
          [
            'treatmentevents',
            {
              friendlyName: 'Treatment Events',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'treatmentevent',
              type: 'one-to-many',
              foreignName: 'collectionobject',
            },
          ],
          [
            'voucherrelationships',
            {
              friendlyName: 'Voucher Relationships',
              isHidden: true,
              isRequired: false,
              isRelationship: true,
              tableName: 'voucherrelationship',
              type: 'one-to-many',
              foreignName: 'collectionobject',
            },
          ],
        ],
      ],
    ],
    WbPlanViewModelHelper.getTableRelationships
  );

  runTest(
    'WbPlanViewModelHelper.tableIsTree',
    [
      [['collectionobject'], false],
      [['non_existent_table'], false],
      [[''], false],
      [['taxon'], true],
      [['geography'], true],
      [['storage'], true],
    ],
    WbPlanViewModelHelper.tableIsTree
  );

  runTest(
    'WbPlanViewModelHelper.relationshipIsToMany',
    [
      [['one-to-many'], true],
      [['many-to-many'], true],
      [['one-to-one'], false],
      [['many-to-one'], false],
    ],
    WbPlanViewModelHelper.relationshipIsToMany
  );

  runTest(
    'WbPlanViewModelHelper.valueIsReferenceItem',
    [
      [[`${dataModelStorage.referenceSymbol}1`], true],
      [[`${dataModelStorage.referenceSymbol}2`], true],
      [[`${dataModelStorage.referenceSymbol}999`], true],
      [['collectionobject'], false],
      [[`${dataModelStorage.treeSymbol}Kingdom`], false],
    ],
    WbPlanViewModelHelper.valueIsReferenceItem
  );

  runTest(
    'WbPlanViewModelHelper.valueIsTreeRank',
    [
      [[`${dataModelStorage.referenceSymbol}1`], false],
      [[`${dataModelStorage.referenceSymbol}2`], false],
      [[`${dataModelStorage.referenceSymbol}999`], false],
      [['collectionobject'], false],
      [[`${dataModelStorage.treeSymbol}Kingdom`], true],
      [[`${dataModelStorage.treeSymbol}County`], true],
    ],
    WbPlanViewModelHelper.valueIsTreeRank
  );

  runTest(
    'WbPlanViewModelHelper.getIndexFromReferenceItemName',
    [
      [[`${dataModelStorage.referenceSymbol}1`], 1],
      [[`${dataModelStorage.referenceSymbol}99`], 99],
      [[`${dataModelStorage.referenceSymbol}0`], 0],
      [[`${dataModelStorage.referenceSymbol}00`], 0],
    ],
    WbPlanViewModelHelper.getIndexFromReferenceItemName
  );

  runTest(
    'WbPlanViewModelHelper.getNameFromTreeRankName',
    [
      [[`${dataModelStorage.treeSymbol}Kingdom`], 'Kingdom'],
      [[`${dataModelStorage.treeSymbol}County`], 'County'],
    ],
    WbPlanViewModelHelper.getNameFromTreeRankName
  );

  runTest(
    'WbPlanViewModelHelper.getMaxToManyValue',
    [
      [
        [
          [
            `${dataModelStorage.referenceSymbol}1`,
            `${dataModelStorage.referenceSymbol}2`,
            `${dataModelStorage.referenceSymbol}3`,
          ],
        ],
        3,
      ],
    ],
    WbPlanViewModelHelper.getMaxToManyValue
  );

  runTest(
    'WbPlanViewModelHelper.showRequiredMissingFields',
    [
      [
        [
          mappingsTree1.baseTableName,
          (mappingsTree1.mappingsTree as unknown) as MappingsTree,
        ],
        [['collectingevent', 'locality', 'localityname']],
      ],
    ],
    WbPlanViewModelHelper.showRequiredMissingFields
  );

  runTest(
    'WbPlanViewModelHelper.isCircularRelationship',
    [
      [
        [
          {
            targetTableName: 'accessionagent',
            parentTableName: 'collectionobject',
            foreignName: 'accession',
            relationshipKey: 'accessionagents',
            currentMappingPathPart: 'accession',
            tableName: 'accession',
          },
        ],
        false,
      ],
      [
        [
          {
            targetTableName: 'collectionobject',
            parentTableName: 'collectionobject',
            foreignName: 'accession',
            relationshipKey: 'collectionobjects',
            currentMappingPathPart: 'accession',
            tableName: 'accession',
          },
        ],
        true,
      ],
      [
        [
          {
            targetTableName: 'agent',
            parentTableName: 'agent',
            foreignName: 'collectors',
            relationshipKey: 'agent',
            currentMappingPathPart: 'collectors',
            tableName: 'collector',
          },
        ],
        true,
      ],
      [
        [
          {
            targetTableName: 'collectingevent',
            parentTableName: 'agent',
            foreignName: 'collectors',
            relationshipKey: 'collectingevent',
            currentMappingPathPart: 'collectors',
            tableName: 'collector',
          },
        ],
        false,
      ],
    ],
    WbPlanViewModelHelper.isCircularRelationship
  );
}
