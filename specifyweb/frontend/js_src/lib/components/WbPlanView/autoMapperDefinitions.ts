/**
 * This file contains information to help auto-map imported XLSX and CSV files
 * to the Specify 6 data model.
 *
 * @remarks
 * Originally Based on
 * https://github.com/specify/specify6/blob/master/config/datamodel_automappings.xml
 *
 * @module
 */

import type { RA, RR } from '../../utils/types';
import type { AnyTree, TableFields } from '../DataModel/helperTypes';
import type { Tables } from '../DataModel/types';
import type { AutoMapperScope, MappingPath } from './Mapper';

/*
 * AutoMapper does 2 passes though the schema whenever it is asked to map
 * some headers. This is needed to ensure priority mapping for some mapping
 * paths. In particular, `shortcuts` and `tableSynonyms` are used on the
 * first pass. The second path goes over `synonyms` and also does string
 * comparison (matching)
 */

/**
 * A structure for defining matching rules
 * NOTE: All values must use lower case exclusively!
 */
export type Options = {
  // Regex match (header.match(regex) !== null)
  readonly regex?: RA<RegExp>;

  // Exact string match (header===string)
  readonly string?: RA<string>;

  // Substring match (header.includes(string))
  readonly contains?: RA<string>;

  /*
   * NOTE: formattedHeaderFieldSynonym is also available as a matching
   * rule, but only for `synonym` rules. See more later in this file
   */
};

// Main structure

export type TableSynonym = {
  /*
   * Mapping path needed to reach <tableName>. Can include any number
   * of parents, up to base table
   */
  readonly mappingPathFilter: MappingPath;
  readonly synonyms: RA<string>;
};

type AutoMapperDefinitions = {
  /*
   * NOTE: all keys and values in the definitions are case-insensitive unless
   * otherwise stated
   */

  /*
   * Table Synonyms are to be used when a table has a different
   *   name in a particular context
   * Also, since autoMapper runs through each table only once,
   *   table synonyms can be used as a way bypass that limitation
   * Besides that, even though `synonyms` and matches are normally
   *   checked in the second pass, if a table has
   *   Table Synonyms, it's `synonyms` and matches would also
   *   be checked in the first pass
   */
  readonly tableSynonyms: Partial<RR<keyof Tables, RA<TableSynonym>>>;

  /*
   * Rank synonyms are used to when the same tree rank can have
   * different name depending on the discipline
   */
  readonly rankSynonyms: Partial<
    RR<
      AnyTree['tableName'],
      RA<{
        readonly rankName: string;
        readonly synonyms: RA<string>;
      }>
    >
  >;

  /*
   * Don't match list designates certain fields in particular
   *   tables as ineligible for automatic matching under
   *   certain scopes
   * This is helpful if some fields are commonly matched when
   *   they should not be
   * Don't match list is of the highest priority and would cancel
   *   a mapping even if a shortcut, or a synonym was used
   */
  readonly dontMatch: {
    readonly [TABLE_NAME in keyof Tables]?: {
      readonly [FIELD_NAME in TableFields<
        Tables[TABLE_NAME]
      >]?: RA<AutoMapperScope>;
    };
  };

  /*
   * Don't map headers that match the regex
   * This is helpful if some fields are too ambiguous and thus should not be
   *  automapped
   * Don't map list is of the highest priority and would cancel
   *   a mapping even if a shortcut, or a synonym was used
   */
  readonly dontMap: Partial<
    RR<
      AutoMapperScope,
      // Described earlier in the file
      { readonly headers: Options }
    >
  >;

  /*
   * Shortcuts are to be used when successful header match should
   *   map to a certain mapping path rather than a field name
   * Shortcuts have higher priority than synonyms and thus can
   *   also be used to map commonly confused fields before they
   *   are erroneously mapped elsewhere
   * Shortcut is followed only if header matched the comparisons
   *   and a path to tableName from baseTableName
   */
  readonly shortcuts: Partial<
    RR<
      keyof Tables,
      Partial<
        RR<
          AutoMapperScope,
          RA<{
            /*
             * Mapping path that is to be appended to the current path
             * when shortcut is followed
             * NOTE: mapping path is case-sensitive
             */
            readonly mappingPath: MappingPath;
            readonly headers: Options;
          }>
        >
      >
    >
  >;

  /*
   * Synonyms should be used when fieldName of tableName should be mapped
   *   to a particular header, yet field label alone is not enough to
   *   guarantee a successful match
   * Synonyms are helpful in situations where field name can be spelled
   *   in different ways, or may vary depending on the context
   * Synonym is used only if header matched the comparisons and
   *   and there exists a path from tableName to baseTableName
   */
  readonly synonyms: {
    readonly [TABLE_NAME in keyof Tables]?: {
      readonly [FIELD_NAME in TableFields<Tables[TABLE_NAME]>]?: Partial<
        RR<
          AutoMapperScope,
          {
            readonly headers: Options & {
              /*
               * Additional matching rule - available
               * only for `synonym` definitions
               * Matches only if header is strictly
               * in one of the following forms:
               *   - <fieldNameSynonym> <tableName>
               *   - <tableName> <fieldNameSynonym>
               *   - <tableName> <index> <fieldNameSynonym>
               *   - <tableName> <fieldNameSynonym> <index>
               * Where <fieldNameSynonym> is the value
               * provided in formattedHeaderFieldSynonym
               */
              readonly formattedHeaderFieldSynonym?: RA<string>;
            };
          }
        >
      >;
    };
  };
};

export const autoMapperDefinitions: AutoMapperDefinitions = {
  tableSynonyms: {
    Agent: [
      {
        mappingPathFilter: ['determination', 'determiner'],
        synonyms: ['determiner', 'who id'],
      },
      {
        mappingPathFilter: ['determinations', 'determiner'],
        synonyms: ['determiner', 'who id'],
      },
      {
        mappingPathFilter: ['collectingEvent', 'collectors', 'agent'],
        synonyms: ['collector'],
      },
      {
        mappingPathFilter: ['collectingEvents', 'collectors', 'agent'],
        synonyms: ['collector'],
      },
      {
        mappingPathFilter: ['collectionObject', 'cataloger'],
        synonyms: ['cataloger'],
      },
      {
        mappingPathFilter: ['collectionObjects', 'cataloger'],
        synonyms: ['cataloger'],
      },
      {
        mappingPathFilter: ['referenceWork', 'authors'],
        synonyms: ['author'],
      },
      {
        mappingPathFilter: ['geoCoordDetails', 'geoRefDetBy'],
        synonyms: ['geo ref by'],
      },
      {
        mappingPathFilter: ['preparation', 'preparedByAgent'],
        synonyms: ['prepared'],
      },
      {
        mappingPathFilter: ['preparations', 'preparedByAgent'],
        synonyms: ['prepared'],
      },
      {
        mappingPathFilter: ['accessionAgent', 'agent'],
        synonyms: ['accession agent', 'accessioned by'],
      },
      {
        mappingPathFilter: ['accessionAgents', 'agent'],
        synonyms: ['accession agent', 'accessioned by'],
      },
      {
        mappingPathFilter: ['dnaSequence', 'sequencer'],
        synonyms: ['sequencer'],
      },
    ],
    Determination: [
      {
        mappingPathFilter: ['collectionObject', 'determinations'],
        synonyms: ['id'],
      },
    ],
    CollectingEvent: [
      {
        mappingPathFilter: [],
        synonyms: ['collected'],
      },
    ],
    CollectionObject: [
      {
        mappingPathFilter: ['collectionObject'],
        synonyms: ['co'],
      },
    ],
    Locality: [
      {
        mappingPathFilter: ['locality'],
        synonyms: ['loc'],
      },
    ],
  },
  rankSynonyms: {
    Taxon: [
      {
        rankName: 'SuperDivision',
        synonyms: ['SuperPhylum'],
      },
      {
        rankName: 'Division',
        synonyms: ['Phylum'],
      },
      {
        rankName: 'SubDivision',
        synonyms: ['SubPhylum'],
      },
      {
        rankName: 'InfraDivision',
        synonyms: ['InfraPhylum'],
      },
      {
        rankName: 'MicroDivision',
        synonyms: ['MicroPhylum'],
      },
      {
        rankName: 'SuperPhylum',
        synonyms: ['SuperDivision'],
      },
      {
        rankName: 'Phylum',
        synonyms: ['Division'],
      },
      {
        rankName: 'SubPhylum',
        synonyms: ['SubDivision'],
      },
      {
        rankName: 'InfraPhylum',
        synonyms: ['InfraDivision'],
      },
      {
        rankName: 'MicroPhylum',
        synonyms: ['MicroDivision'],
      },
    ],
  },
  dontMatch: {
    Address: {
      // These ranks were getting mapped to Address instead of Geography
      country: ['autoMapper'],
      state: ['autoMapper'],
    },
  },
  dontMap: {
    autoMapper: {
      headers: {
        regex: [/^type[^a-z]*$/, /^remarks/, /^notes/],
      },
    },
  },
  shortcuts: {
    CollectionObject: {
      autoMapper: [
        {
          mappingPath: ['cataloger', 'lastName'],
          headers: {
            contains: ['cataloged by', 'catalogued by'],
          },
        },
      ],
      suggestion: [
        {
          mappingPath: ['cataloger', 'lastName'],
          headers: {
            contains: ['cataloged by', 'catalogued by'],
          },
        },
      ],
    },
    Determination: {
      suggestion: [
        {
          mappingPath: ['determiner', 'lastName'],
          headers: {
            contains: ['determiner'],
          },
        },
      ],
    },
  },
  synonyms: {
    DNASequence: {
      genbankAccessionNumber: {
        autoMapper: {
          headers: {
            contains: ['genbank'],
          },
        },
      },
    },
    Agent: {
      middleInitial: {
        suggestion: {
          headers: {
            contains: ['middle'],
          },
        },
        autoMapper: {
          headers: {
            formattedHeaderFieldSynonym: ['middle'],
          },
        },
      },
      firstName: {
        suggestion: {
          headers: {
            contains: ['first'],
          },
        },
        autoMapper: {
          headers: {
            formattedHeaderFieldSynonym: ['first'],
          },
        },
      },
      lastName: {
        suggestion: {
          headers: {
            contains: ['last'],
          },
        },
        autoMapper: {
          headers: {
            formattedHeaderFieldSynonym: ['last'],
          },
        },
      },
    },
    CollectingEvent: {
      verbatimDate: {
        suggestion: {
          headers: {
            contains: ['date verbatim', 'date collected verbatim'],
          },
        },
      },
      startDate: {
        autoMapper: {
          headers: {
            string: ['date'],
          },
        },
        suggestion: {
          headers: {
            contains: ['start', 'collected'],
          },
        },
      },
      endDate: {
        suggestion: {
          headers: {
            contains: ['end', 'date'],
          },
        },
      },
      method: {
        autoMapper: {
          headers: {
            contains: ['collection method'],
          },
        },
        suggestion: {
          headers: {
            contains: ['method'],
          },
        },
      },
      stationFieldNumber: {
        autoMapper: {
          headers: {
            regex: [
              /^(?:coll(?:ect(?:ing)?)?\.??(?: ev(?:ent)?)?\.?|field)?(?: (?:#|n(?:o|um(?:ber)?)?))?\.?$/,
            ],
          },
        },
      },
    },
    Accession: {
      accessionNumber: {
        autoMapper: {
          headers: {
            regex: [/^acc(?:ession)?\.?(?: (?:#|n(?:o|um(?:ber)?)?))?\.?$/],
            string: ['accession'],
          },
        },
      },
    },
    Locality: {
      maxElevation: {
        autoMapper: {
          headers: {
            contains: ['max elev', 'max depth'],
          },
        },
      },
      minElevation: {
        autoMapper: {
          headers: {
            contains: ['elev', 'depth'],
          },
        },
      },
      latitude1: {
        autoMapper: {
          headers: {
            contains: ['latitude 1'],
            string: ['latitude', 'lat', 'lat1', 'lat 1'],
          },
        },
        suggestion: {
          headers: {
            contains: ['latitude', 'lat '],
          },
        },
      },
      latitude2: {
        autoMapper: {
          headers: {
            contains: ['latitude 2'],
          },
        },
      },
      longitude1: {
        autoMapper: {
          headers: {
            contains: ['longitude 1'],
            string: ['longitude', 'long', 'long1', 'long 1'],
          },
        },
        suggestion: {
          headers: {
            contains: ['longitude', 'long '],
          },
        },
      },
      longitude2: {
        autoMapper: {
          headers: {
            contains: ['longitude 2'],
          },
        },
      },
      latLongMethod: {
        autoMapper: {
          headers: {
            contains: ['lat/long method'],
          },
        },
        suggestion: {
          headers: {
            contains: ['method'],
          },
        },
      },
      localityName: {
        autoMapper: {
          headers: {
            string: ['localitynum', 'locality'],
          },
        },
        suggestion: {
          headers: {
            contains: ['location'],
          },
        },
      },
      namedPlace: {
        autoMapper: {
          headers: {
            contains: ['named place'],
          },
        },
      },
    },
    Gift: {
      receivedComments: {
        suggestion: {
          headers: {
            contains: ['comments'],
          },
        },
      },
    },
    CollectionObject: {
      fieldNumber: {
        autoMapper: {
          headers: {
            contains: ['field #', 'field no', 'field num'],
          },
        },
      },
      catalogedDate: {
        autoMapper: {
          headers: {
            contains: ['catalog date', 'cataloged date', 'catalogued date'],
            string: ['cat date'],
          },
        },
      },
      catalogNumber: {
        autoMapper: {
          headers: {
            regex: [
              /^(?:specimen|cat(?:alogu?e?)?)\.?(?: (?:#|n(?:o|um(?:ber)?)?))?\.?$/,
            ],
          },
        },
        suggestion: {
          headers: {
            string: ['#', 'no', 'num', 'number'],
          },
        },
      },
      altCatalogNumber: {
        autoMapper: {
          headers: {
            regex: [
              /^alt(?:ernative)?\.? (?:specimen|cat(?:alogu?e?)?)\.?(?: (?:#|n(?:o|um(?:ber)?)?))?\.?$/,
            ],
            string: ['altcatno'],
          },
        },
      },
    },
    Determination: {
      determinedDate: {
        suggestion: {
          headers: {
            contains: ['date'],
          },
        },
        autoMapper: {
          headers: {
            formattedHeaderFieldSynonym: ['date'],
          },
        },
      },
      typeStatusName: {
        suggestion: {
          headers: {
            contains: ['status'],
          },
        },
        autoMapper: {
          headers: {
            formattedHeaderFieldSynonym: ['status'],
          },
        },
      },
    },
    PrepType: {
      name: {
        autoMapper: {
          headers: {
            contains: ['preptype', 'prep ', 'preparation'],
          },
        },
      },
    },
  },
};
