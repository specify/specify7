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
              label: 'Alt Cat Number',
              isHidden: false,
              isRequired: false,
              isRelationship: false,
            },
          ],
          [
            'catalognumber',
            {
              label: 'Catalog Number',
              isHidden: false,
              isRequired: false,
              isRelationship: false,
            },
          ],
          [
            'catalogeddate',
            {
              label: 'Cataloged Date',
              isHidden: false,
              isRequired: false,
              isRelationship: false,
            },
          ],
          [
            'guid',
            {
              label: 'GUID',
              isHidden: false,
              isRequired: false,
              isRelationship: false,
            },
          ],
          [
            'projectnumber',
            {
              label: 'Project Number',
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
              label: 'Agent1',
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
              label: 'Appraisal',
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
              label: 'Collection Object Citations',
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
              label: 'Collection Object Properties',
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
              label: 'Conserv Descriptions',
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
              label: 'Container',
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
              label: 'Container Owner',
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
              label: 'Created By Agent',
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
              label: 'DNA Sequences',
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
              label: 'Exsiccata Items',
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
              label: 'Field Notebook Page',
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
              label: 'Inventoried By',
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
              label: 'Modified By Agent',
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
              label: 'Paleo Context',
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
              label: 'Projects',
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
              label: 'Treatment Events',
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
              label: 'Voucher Relationships',
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
    'WbPlanViewModelHelper.findRequiredMissingFields',
    [
      [
        [
          mappingsTree1.baseTableName,
          mappingsTree1.mappingsTree as unknown as MappingsTree,
        ],
        [['collectingevent', 'locality', 'localityname']],
      ],
    ],
    WbPlanViewModelHelper.findRequiredMissingFields
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
