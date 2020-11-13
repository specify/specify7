'use strict'

// This file contains information to help auto-map imported XLSX and CSV files to the Specify 6 data model
// Originally Based on https://github.com/specify/specify6/blob/master/config/datamodel_automappings.xml

//	SCHEMA:
//	shortcuts (object):
//		[base_table_name] (object, case insensitive):
//			[field_name] (object, case insensitive):
//				[option] (array, case insensitive):
//					[value] (string, case sensitive)
//	synonyms (object):
//		[table_name] (object, case insensitive):
//			[field_name] (object, case insensitive):
//				[option] (array, case insensitive):
//					[value] (string, case sensitive)
//
// 	Available options:
// 		regex - Regex string (header.match(regex))
// 		string - Equals string (header===string)
// 		contains - Contains string (header.indexOf(string)!==-1)


module.exports = {
	shortcuts: {
		CollectionObject: [
			{
				mapping_path: ['cataloger','lastName'],
				headers: {
					contains: [
						'cataloged by',
						'catalogued by',
						'cataloger',
					]
				},
			},
			{
				mapping_path: ['collectingEvent','locality','geography','country','name'],
				headers: {
					string: [
						'country',
					]
				}
			}
		],
		Determination: [
			{
				mapping_path: ['determiner','lastname'],
				headers: {
					contains: [
						'determiner',
					]
				}
			}
		],
	},
	synonyms: {
		CollectingEvent:  {
			verbatimDate: {
				contains: [
					'date verbatim'
				]
			},
			startDate:  {
				contains:  [
					'date',
					'start',
					'collected',
				]
			},
			endDate:  {
				contains:  [
					'end'
				]
			},
			method: {
				contains: [
					'method'
				]
			}
		},
		Accession:  {
			accessionnumber:  {
				contains:  [
					'accession'
				]
			}
		},
		Locality:  {
			maxElevation:  {
				contains: [
					'max elev',
					'max depth'
				],
			},
			minElevation:  {
				contains:  [
					'elev',
					'depth'
				]
			},
			latitude1: {
				contains: [
					'latitude 1'
				]
			},
			latitude2: {
				contains: [
					'latitude 2'
				]
			},
			longitude1: {
				contains: [
					'longitude 1'
				]
			},
			longitude2: {
				contains: [
					'longitude 2'
				]
			},
		},
		CollectionObject:  {
			fieldNumber:  {
				contains: [
					'field no',
					'field num'
				]
			},
			catalogedDate:  {
				contains:  [
					'cataloged date',
					'catalogued date'
				]
			},
			catalogNumber:  {
				regex:  [
					'^catalog(ue)?\\s*(no|num).*',
					'^cat(ue)?\\s*(no|num).*'],
				string:  [
					'number',
					'num',
					'bmsm no.'
				]
			}
		},
		Geography: {
			state: {
				contains: [
					'state',
				]
			},
			continent: {
				contains: [
					'continent',
				]
			}
		},
		PrepType: {
			name: {
				contains: [
					'prep '
				]
			}
		}
	},
};
