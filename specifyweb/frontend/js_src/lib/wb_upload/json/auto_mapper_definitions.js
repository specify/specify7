'use strict';

// This file contains information to help auto-map imported XLSX and CSV files to the Specify 6 data model
// Originally Based on https://github.com/specify/specify6/blob/master/config/datamodel_automappings.xml

//	SCHEMA: {
//		shortcuts: {
//			[table_name] (case insensitive): {
//				mapping_path: []
//				headers: {
//					[option]: {
//						[value]
//					}
//				}
//				scope (string, case sensitive)
//			}
//		}
//		synonyms: {
//			[table_name] (case insensitive): {
//				[field_name] (case insensitive): {
//					headers: {
//						[option]: {
//							[value]
//						}
//					}
//					scope (string, case sensitive)
//				}
//			}
//		}
//	}
//
// 	Available options:
// 		regex - Regex string (header.match(regex))
// 		string - Equals string (header===string)
// 		contains - Contains string (header.indexOf(string)!==-1)
//
//	Available scopes:
//		automapper - only used by automapper
//		suggestion - only used by suggestion boxes
//
//	Shortcuts have higher priority than synonyms.
//	Shortcuts should be used when certain mapping path is desired
//	Synonyms should be used when field_name of table_name should be mapped
//	Shortcuts and Synonyms are valid only if header matched and there is a path to table_name from base_table_name


module.exports = {
	shortcuts: {
		CollectionObject: [
			{
				mapping_path: ['cataloger', 'lastName'],
				headers: {
					contains: [
						'cataloged by',
						'catalogued by',
						'cataloger',
					]
				},
				scope: 'automapper',
			},
			{
				mapping_path: ['collectingEvent', 'locality', 'geography', 'country', 'name'],
				headers: {
					string: [
						'country',
					]
				},
				scope: 'suggestion',
			}
		],
		Determination: [
			{
				mapping_path: ['determiner', 'lastname'],
				headers: {
					contains: [
						'determiner',
					]
				},
				scope: 'suggestion',
			}
		],
	},
	synonyms: {
		CollectingEvent: {
			verbatimDate: {
				headers: {
					contains: [
						'date verbatim'
					]
				},
				scope: 'automapper',
			},
			startDate: {
				headers: {
					contains: [
						'date',
						'start',
						'collected',
					]
				},
				scope: 'suggestion',
			},
			endDate: {
				headers: {
					contains: [
						'end'
					]
				},
				scope: 'suggestion',
			},
			method: {
				headers: {
					contains: [
						'method'
					]
				},
				scope: 'automapper',
			}
		},
		Accession: {
			accessionnumber: {
				headers: {
					contains: [
						'accession'
					]
				},
				scope: 'automapper',
			}
		},
		Locality: {
			maxElevation: {
				headers: {
					contains: [
						'max elev',
						'max depth'
					],
				},
				scope: 'automapper',
			},
			minElevation: {
				headers: {
					contains: [
						'elev',
						'depth'
					]
				},
				scope: 'automapper',
			},
			latitude1: {
				headers: {
					contains: [
						'latitude 1'
					]
				},
				scope: 'automapper',
			},
			latitude2: {
				headers: {
					contains: [
						'latitude 2'
					]
				},
				scope: 'automapper',
			},
			longitude1: {
				headers: {
					contains: [
						'longitude 1'
					]
				},
				scope: 'automapper',
			},
			longitude2: {
				headers: {
					contains: [
						'longitude 2'
					]
				},
				scope: 'automapper',
			},
		},
		CollectionObject: {
			fieldNumber: {
				headers: {
					contains: [
						'field no',
						'field num'
					]
				},
				scope: 'automapper',
			},
			catalogedDate: {
				headers: {
					contains: [
						'cataloged date',
						'catalogued date'
					]
				},
				scope: 'automapper',
			},
			catalogNumber: {
				headers: {
					regex: [
						'^catalog(ue)?\\s*(no|num).*',
						'^cat(ue)?\\s*(no|num).*'],
					string: [
						'number',
						'num',
						'bmsm no.'
					]
				},
				scope: 'automapper',
			}
		},
		Geography: {
			state: {
				headers: {
					contains: [
						'state',
					]
				},
				scope: 'suggestion',
			},
			continent: {
				headers: {
					contains: [
						'continent',
					]
				},
				scope: 'suggestion',
			}
		},
		PrepType: {
			name: {
				headers: {
					contains: [
						'prep '
					]
				},
				scope: 'automapper',
			}
		}
	},
};
