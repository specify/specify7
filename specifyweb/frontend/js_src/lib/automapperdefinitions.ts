/*
*
* This file contains information to help auto-map imported XLSX and CSV files
* to the Specify 6 data model. Originally Based on
* https://github.com/specify/specify6/blob/master/config/datamodel_automappings.xml
*
* */

'use strict';

import { AutomapperScope, MappingPath } from './components/wbplanviewmapper';

//  Automapper does 2 passes though the schema whenever it is asked to map
//  some headers. This is needed to ensure priority mapping for some mapping
//  paths. In particular, `shortcuts` and `table_synonyms` are used on the
//  first pass. The second path goes over `synonyms` and also does string
//  comparison (matching)

export interface Options {
  /*
  * A structure for defining matching rules
  * NOTE: All values must use lower case exclusively!
  * */

  // Regex match (header.match(regex) !== null)
  readonly regex?: RegExp[],

  // Exact string match (header===string)
  readonly string?: string[],

  // Substring match (header.indexOf(string)!==-1)
  readonly contains?: string[],

  // NOTE: formatted_header_field_synonym is also available as a matching
  // rule, but only for `synonym` rules. See more later in this file

}

// main structure

export interface TableSynonym {
  // Mapping path needed to reach <table_name>. Can include any number
  // of parents, up to base table
  mapping_path_filter: MappingPath,
  synonyms: string[]
}

interface AutoMapperDefinitions {

  /*
  * NOTE: all keys and values in the definitions should use lower case
  * (since headers, table names and field names used by the mapper are
  * all in lower case), unless it is explicitly specified that they are
  * case-insensitive
  * */

  /*
  * Table Synonyms are to be used when a table has a different
  *   name in a particular context
  * Also, since automapper runs through each table only once,
  *   table synonyms can be used as a way bypass that limitation
  * Besides that, even though `synonyms` and matches are normally
  *   checked in the second pass, if a table has
  *   Table Synonyms, it's `synonyms` and matches would also
  *   be checked in the first pass
  */
  table_synonyms: Record<string,  // table_name (case-insensitive)
    TableSynonym[]  // described earlier in the file
    >,

  /*
  * Rank synonyms are used to when the same tree rank can have
  * different name depending on the discipline
  */
  rank_synonyms: Record<string,  // table_name (case-insensitive)
    {
      rank_name: string,
      synonyms: string[]
    }[]>

  /*
  * Don't match list designates certain fields in particular
  *   tables as ineligible for automatic matching under
  *   certain scopes
  * This is helpful if certain fields are commonly matched when
  *   they should be
  * Don't match list is of the highest priority and would cancel
  *   a mapping even if a shortcut, or a synonym was used
  */
  dont_match: Record<string,  // table_name (case-insensitive)
    Record<string,  // field_name (case-insensitive)
      AutomapperScope[]  // defined in wbplanviewmapper.tsx
      >>,

  /*
  * Shortcuts are to be used when successful header match should
  *   map to a certain mapping path rather than a field name
  * Shortcuts have higher priority than synonyms and thus can
  *   also be used to map commonly confused fields before they
  *   are erroneously mapped elsewhere
  * Shortcut is followed only if header matched the comparisons
  *   and a path to table_name from base_table_name
  */
  shortcuts: Record<string,  // table_name (case-insensitive)
    Partial<Record<AutomapperScope,  // defined in wbplanviewmapper.tsx
      {
        // mapping path that is to be appended to the current path
        // when shortcut is followed
        readonly mapping_path: MappingPath,
        readonly headers: Options  // described earlier in the file
      }[]>>>,

  /*
  * Synonyms should be used when field_name of table_name should be mapped
  *   to a particular header, yet field label alone is not enough to
  *   guarantee a successful match
  * Synonyms are helpful in situations where field name can be spelled
  *   in different ways, or may vary depending on the context
  * Synonym is used only if header matched the comparisons and
  *   and there exists a path from table_name to base_table_name
  */
  synonyms: Record<string,  // table_name (case-insensitive)
    Record<string,  // field_name (case-insensitive)
      Partial<Record<AutomapperScope,  // defined in wbplanviewmapper.tsx
        {
          headers: Options &
            {
              // Additional matching rule - available
              // only for `synonym` definitions
              // Matches only if header is strictly
              // in one of the following forms:
              //  - <field_name_synonym> <table_name>
              //   - <table_name> <field_name_synonym>
              //   - <table_name> <index> <field_name_synonym>
              //   - <table_name> <field_name_synonym> <index>
              // Where <field_name_synonym> is the value
              // provided in formatted_header_field_synonym
              formatted_header_field_synonym?: string[],
            }
        }>>>>,
}

const definitions: AutoMapperDefinitions = {
  table_synonyms: {
    Agent: [
      {
        mapping_path_filter: ['determinations', 'determiner'],
        synonyms: [
          'determiner',
          'who id',
        ],
      },
      {
        mapping_path_filter: ['collectingevent', 'collectors', 'agent'],
        synonyms: [
          'collector',
        ],
      },
      {
        mapping_path_filter: ['collectionobject', 'cataloger'],
        synonyms: [
          'cataloger',
        ],
      },
      {
        mapping_path_filter: ['referencework', 'authors'],
        synonyms: [
          'author',
        ],
      },
      {
        mapping_path_filter: ['geocoorddetails', 'georefdetby'],
        synonyms: [
          'geo ref by',
        ],
      },
      {
        mapping_path_filter: ['preparations', 'preparedbyagent'],
        synonyms: [
          'prepared',
        ],
      },
    ],
    Determination: [
      {
        mapping_path_filter: ['collectionobject', 'determinations'],
        synonyms: [
          'id',
        ],
      },
    ],
    CollectingEvent: [
      {
        mapping_path_filter: [],
        synonyms: [
          'collected',
        ],
      },
    ],
    CollectionObject: [
      {
        mapping_path_filter: ['collectionobject'],
        synonyms: [
          'co',
        ],
      },
    ],
    Locality: [
      {
        mapping_path_filter: ['locality'],
        synonyms: [
          'loc',
        ],
      },
    ],
  },
  rank_synonyms: {
    Taxon: [
      {
        rank_name: 'Superdivision',
        synonyms: [
          'Superphylum',
        ],
      },
      {
        rank_name: 'Division',
        synonyms: [
          'Phylum',
        ],
      },
      {
        rank_name: 'Subdivision',
        synonyms: [
          'Subphylum',
        ],
      },
      {
        rank_name: 'Infradivision',
        synonyms: [
          'Infraphylum',
        ],
      },
      {
        rank_name: 'Microdivision',
        synonyms: [
          'Microphylum',
        ],
      },
      {
        'rank_name': 'Superphylum',
        'synonyms': [
          'Superdivision',
        ],
      },
      {
        'rank_name': 'Phylum',
        'synonyms': [
          'Division',
        ],
      },
      {
        'rank_name': 'Subphylum',
        'synonyms': [
          'Subdivision',
        ],
      },
      {
        'rank_name': 'Infraphylum',
        'synonyms': [
          'Infradivision',
        ],
      },
      {
        'rank_name': 'Microphylum',
        'synonyms': [
          'Microdivision',
        ],
      },
    ],
  },
  dont_match: {
    Address: {
      country: ['automapper'],
      state: ['automapper'],
    },
  },
  shortcuts: {
    CollectionObject: {
      automapper: [
        {
          mapping_path: ['cataloger', 'lastname'],
          headers: {
            contains: [
              'cataloged by',
              'catalogued by',
            ],
          },
        },
      ],
      suggestion: [
        {
          mapping_path: ['cataloger', 'lastname'],
          headers: {
            contains: [
              'cataloged by',
              'catalogued by',
            ],
          },
        },
      ],
    },
    Determination: {
      suggestion: [
        {
          mapping_path: ['determiner', 'lastname'],
          headers: {
            contains: [
              'determiner',
            ],
          },
        },
      ],
    },
  },
  synonyms: {
    Agent: {
      middleInitial: {
        suggestion: {
          headers: {
            contains: [
              'middle',
            ],
          },
        },
        automapper: {
          headers: {
            formatted_header_field_synonym: [
              'middle',
            ],
          },
        },
      },
      firstName: {
        suggestion: {
          headers: {
            contains: [
              'first',
            ],
          },
        },
        automapper: {
          headers: {
            formatted_header_field_synonym: [
              'first',
            ],
          },
        },
      },
      lastName: {
        suggestion: {
          headers: {
            contains: [
              'last',
            ],
          },
        },
        automapper: {
          headers: {
            formatted_header_field_synonym: [
              'last',
            ],
          },
        },
      },
    },
    CollectingEvent: {
      verbatimDate: {
        suggestion: {
          headers: {
            contains: [
              'date verbatim',
              'date collected verbatim',
            ],
          },
        },
      },
      startDate: {
        suggestion: {
          headers: {
            contains: [
              'date',
              'start',
              'collected',
            ],
          },
        },
      },
      endDate: {
        suggestion: {
          headers: {
            contains: [
              'end',
              'date',
            ],
          },
        },
      },
      method: {
        automapper: {
          headers: {
            contains: [
              'method',
            ],
          },
        },
      },
      stationfieldnumber: {
        automapper: {
          headers: {
            regex: [
              /^(coll(ect(ing)?)?) (ev(ent)?|(#|n(o|um(er)?)?)|ev(ent)? (#|n(o|um(er)?)?))/,
            ],
          },
        },
      },
    },
    Accession: {
      accessionnumber: {
        automapper: {
          headers: {
            regex: [
              /acc(ession)? (#|n(o|um(er)?)?)/,
            ],
            string: [
              'accession',
            ],
          },
        },
      },
    },
    Locality: {
      maxElevation: {
        automapper: {
          headers: {
            contains: [
              'max elev',
              'max depth',
            ],
          },
        },
      },
      minElevation: {
        automapper: {
          headers: {
            contains: [
              'elev',
              'depth',
            ],
          },
        },
      },
      latitude1: {
        automapper: {
          headers: {
            contains: [
              'latitude 1',
            ],
          },
        },
      },
      latitude2: {
        automapper: {
          headers: {
            contains: [
              'latitude 2',
            ],
          },
        },
      },
      longitude1: {
        automapper: {
          headers: {
            contains: [
              'longitude 1',
            ],
          },
        },
      },
      longitude2: {
        automapper: {
          headers: {
            contains: [
              'longitude 2',
            ],
          },
        },
      },
      localityname: {
        automapper: {
          headers: {
            string: [
              'localitynum',
              'locality',
            ],
          },
        },
        suggestion: {
          headers: {
            contains: [
              'location',
            ],
          },
        },
      },
      namedplace: {
        automapper: {
          headers: {
            contains: [
              'named place',
            ],
          },
        },
      },
    },
    Gift: {
      receivedComments: {
        suggestion: {
          headers: {
            contains: [
              'comments',
            ],
          },
        },
      },
    },
    CollectionObject: {
      fieldNumber: {
        automapper: {
          headers: {
            contains: [
              'field #',
              'field no',
              'field num',
            ],
          },
        },
      },
      catalogedDate: {
        automapper: {
          headers: {
            contains: [
              'catalog date',
              'cataloged date',
              'catalogued date',
            ],
            string: [
              'cat date',
            ],
          },
        },
      },
      catalogNumber: {
        automapper: {
          headers: {
            regex: [
              /specimen|cat(alog(ue)?)? ?(#|n(o|um(er)?)?)/,
            ],
          },
        },
        suggestion: {
          headers: {
            string: [
              '#',
              'no',
              'num',
              'number',
            ],
          },
        },
      },
      altcatalognumber: {
        automapper: {
          headers: {
            regex: [
              /(alt(ernative)?) (specimen|cat(alog(ue)?))? ?(#|n(o|um(er)?)?)/,
            ],
            string: [
              'altcatno',
            ],
          },
        },
      },
    },
    Geography: {
      state: {
        automapper: {
          headers: {
            contains: [
              'state',
            ],
          },
        },
      },
      continent: {
        automapper: {
          headers: {
            contains: [
              'continent',
            ],
          },
        },
      },
    },
    Determination: {
      determinedDate: {
        suggestion: {
          headers: {
            contains: [
              'date',
            ],
          },
        },
        automapper: {
          headers: {
            formatted_header_field_synonym: [
              'date',
            ],
          },
        },
      },
      typeStatusName: {
        suggestion: {
          headers: {
            contains: [
              'status',
            ],
          },
        },
        automapper: {
          headers: {
            formatted_header_field_synonym: [
              'status',
            ],
          },
        },
      },
    },
    PrepType: {
      name: {
        automapper: {
          headers: {
            contains: [
              'prep ',
              'preparation',
            ],
          },
        },
      },
    },
  },
};

/* Method that converts all table names and field names in definitions to
* lower case */
function definitions_to_lowercase(
  definitions: AutoMapperDefinitions,
): AutoMapperDefinitions {

  const keys_to_lower_case = (object: object, levels = 1): object => (
    Object.fromEntries(
      Object.entries(object).map(([key, value]) =>
        [
          key.toLowerCase(),
          levels > 1 ?
            keys_to_lower_case(value, levels - 1) :
            value,
        ],
      ),
    )
  );

  // specify how deep to go into each branch when converting
  const structure_depth: [
    structure_name: keyof typeof definitions, depth: number
  ][] = [
    ['table_synonyms', 1],
    ['rank_synonyms', 1],
    ['dont_match', 2],
    ['shortcuts', 1],
    ['synonyms', 2],
  ];
  structure_depth.forEach(([structure_name, depth]) => (
    //@ts-ignore
    definitions[structure_name] = keys_to_lower_case(
      definitions[structure_name],
      depth,
    )
  ));

  return Object.freeze(definitions);

}

export default definitions_to_lowercase(definitions);