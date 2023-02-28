import type { LocalizedString } from 'typesafe-i18n';

import { mockTime, requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { addMissingFields } from '../addMissingFields';
import type { AnySchema, SerializedResource } from '../helperTypes';
import { getResourceApiUrl } from '../resource';
import type { Agent } from '../types';

mockTime();
requireContext();

/**
 * A typing helper
 * This is needed because addMissingFields relies on a generic, but the theories
 * function does not seem to support generics at the moment
 */
const typing = <T extends AnySchema = AnySchema>(
  data: Partial<SerializedResource<T>>
): Partial<SerializedResource<AnySchema>> =>
  data as Partial<SerializedResource<AnySchema>>;

theories(addMissingFields, [
  {
    in: [
      'CollectionObject',
      {},
      {
        requiredFields: 'omit',
        optionalFields: 'omit',
        toManyRelationships: 'omit',
        requiredRelationships: 'omit',
        optionalRelationships: 'omit',
      },
    ],
    out: typing({
      _tableName: 'CollectionObject',
      collection: getResourceApiUrl('Collection', 4),
    }),
  },
  {
    in: [
      'CollectionObject',
      typing({ text1: 'abc' }),
      {
        requiredFields: 'omit',
        optionalFields: 'omit',
        toManyRelationships: 'omit',
        requiredRelationships: 'omit',
        optionalRelationships: 'omit',
      },
    ],
    out: {
      _tableName: 'CollectionObject',
      resource_uri: undefined,
      collection: getResourceApiUrl('Collection', 4),
      text1: 'abc',
    },
  },
  {
    in: [
      'Agent',
      typing({ text1: 'abc', division: getResourceApiUrl('Division', 5) }),
      {
        requiredFields: 'omit',
        optionalFields: 'define',
        toManyRelationships: 'set',
        requiredRelationships: 'omit',
        optionalRelationships: 'define',
      },
    ],
    out: typing<Agent>({
      _tableName: 'Agent',
      abbreviation: null,
      addresses: [],
      agentAttachments: [],
      agentGeographies: [],
      agentSpecialties: [],
      collContentContact: null,
      collTechContact: null,
      createdByAgent: null,
      date1: null,
      date1Precision: null,
      date2: null,
      date2Precision: null,
      dateOfBirth: null,
      dateOfBirthPrecision: null,
      dateOfDeath: null,
      dateOfDeathPrecision: null,
      dateType: null,
      division: getResourceApiUrl('Division', 5),
      email: null,
      firstName: null,
      groups: [],
      guid: null,
      identifiers: [],
      initials: null,
      instContentContact: null,
      instTechContact: null,
      integer1: null,
      integer2: null,
      interests: null,
      jobTitle: null,
      lastName: null,
      middleInitial: null,
      modifiedByAgent: null,
      organization: null,
      remarks: null,
      resource_uri: undefined,
      specifyUser: null,
      suffix: null,
      text1: 'abc' as LocalizedString,
      text2: null,
      text3: null,
      text4: null,
      text5: null,
      timestampModified: null,
      title: null,
      url: null,
      variants: [],
      verbatimDate1: null,
      verbatimDate2: null,
      version: 1,
    }),
  },
  {
    in: [
      'Agent',
      typing({ text2: 'abc' }),
      {
        requiredFields: 'define',
        optionalFields: 'set',
        toManyRelationships: 'omit',
        requiredRelationships: 'define',
        optionalRelationships: 'set',
      },
    ],
    out: typing({
      _tableName: 'Agent',
      abbreviation: '',
      agentType: null,
      collContentContact: null,
      collTechContact: null,
      createdByAgent: null,
      date1: '2022-08-31',
      date1Precision: 0,
      date2: '2022-08-31',
      date2Precision: 0,
      dateOfBirth: '2022-08-31',
      dateOfBirthPrecision: 0,
      dateOfDeath: '2022-08-31',
      dateOfDeathPrecision: 0,
      dateType: 0,
      division: getResourceApiUrl('Division', 2),
      email: '',
      firstName: '',
      guid: '',
      initials: '',
      instContentContact: null,
      instTechContact: null,
      integer1: 0,
      integer2: 0,
      interests: '',
      jobTitle: '',
      lastName: '',
      middleInitial: '',
      modifiedByAgent: null,
      organization: null,
      remarks: '',
      specifyUser: null,
      suffix: '',
      text1: '',
      text2: 'abc',
      text3: '',
      text4: '',
      text5: '',
      timestampCreated: null,
      timestampModified: '2022-08-31',
      title: '',
      url: '',
      verbatimDate1: '',
      verbatimDate2: '',
      version: 1,
    }),
  },
]);
