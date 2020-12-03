'use strict';

// This file contains information to help auto-map imported XLSX and CSV files to the Specify 6 data model
// Originally Based on https://github.com/specify/specify6/blob/master/config/datamodel_automappings.xml

//	Automapper does 2 passes though the schema whenever it is asked to map some headers
//	This is needed in order to ensure priority mapping for some mapping paths
//	In particular, `shortcuts` and `table_synonyms` are used on the first pass
//	The second path goes over `synonyms` and also does string comparison (matching)
//
//
//	SCHEMA: {
//		table_synonyms: {
//			/*
//			 * Table Synonyms are to be used when a table has a different name in a particular context
//			 * Also, since automapper runs through each table only once, table synonyms can be used as a way bypass that limitation
//			 * Besides that, even though `synonyms` and matches are normally checked in the second pass, if a table has Table Synonyms, it's `synonyms` and matches would also be checked in the first pass
//			 */
//			<table_name> (case insensitive): [
//				{
//					mapping_path_filter: [<mapping_path>],  // mapping path needed to reach <table_name> with or without base table or current base table
//					synonyms: [
//						'<synonym>'
//					]
//				}
//			]
//		},
//		dont_match: {
//			/*
//			 * Don't match list designates certain fields in particular tables as ineligible for automatic matching under certain scopes
//			 * This is helpful if certain fields are commonly matched when they should be
//			 * Don't match list is of the highest priority and would cancel a mapping even if a shortcut or a synonym was used
//			 */
//			<table_name> (case insensitive): {
//				<field_name> (case insensitive): [
//					'<scope_name>'
//				]
//			}
//		},
//		shortcuts: {
//			/*
//			 * Shortcuts are to be used when successful header match should map to a certain mapping path rather than a field name
//			 * Shortcuts have higher priority than synonyms and thus can also be used to map commonly confused fields before they are erroneously mapped elsewhere
//			 * Shortcut is followed only if header matched the comparisons and there is a path to table_name from base_table_name
//			 */
//			<table_name> (case insensitive): {
//				<scope_name>: [
//					{
//						mapping_path: [<mapping_path>],  // mapping path to be appended to the current path when shortcut is followed
//						headers: {
//							<option_name>: {
//								'<value>' (case insensitive)
//							}
//						}
//					}
//				]
//			}
//		},
//		synonyms: {
//			<table_name> (case insensitive): {
//				/*
//				 * Synonyms should be used when field_name of table_name should be mapped to a particular header, yet field label alone is not enough to guarantee a successful match
//				 * Synonyms are helpful in situations where field name can be spelled in different ways, or may vary depending on the context
//			 	 * Synonym is applied used only if header matched the comparisons and there is a path to table_name from base_table_name
//				 */
//				<field_name> (case insensitive): {
//					<scope_name>: {
//						headers: {
//							<option_name>: {
//								'<value>' (case insensitive)
//							}
//						},
//					}
//				}
//			}
//		}
//	}
//
// 	Available options:
// 		regex - Regex string (header.match(regex))
// 		string - Equals string (header===string)
// 		contains - Contains string (header.indexOf(string)!==-1)
//		formatted_header_field_synonym - Available only in the `synonym` definitions
//										 Matches only if header is strictly one of the following forms:
//											- <field_name_synonym> <table_name>
//											- <table_name> <field_name_synonym>
//											- <table_name> <index> <field_name_synonym>
//											- <table_name> <field_name_synonym> <index>
//										 Where <field_name_synonym> is the value provided in formatted_header_field_synonym
//
//	Available scopes:
//		automapper - only used by automapper
//		suggestion - only used by suggestion boxes
//
//


const auto_mapper_definitions = {
	table_synonyms: {
		Agent: [
			{
				mapping_path_filter: ['determinations', 'determiner'],
				synonyms: [
					'determiner',
					'who id'
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
			}
		],
		Determination: [
			{
				mapping_path_filter: ['collectionobject', 'determinations'],
				synonyms: [
					'id'
				]
			},
		],
		CollectingEvent: [
			{
				mapping_path_filter: [],
				synonyms: [
					'collected'
				]
			}
		],
	},
	dont_match: {
		Address: {
			country: ['automapper'],
			state: ['automapper'],
		}
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
						]
					},
				}
			],
			suggestion: [
				{
					mapping_path: ['cataloger', 'lastname'],
					headers: {
						contains: [
							'cataloged by',
							'catalogued by',
						]
					},
				},
			]
		},
		Determination: {
			suggestion: [
				{
					mapping_path: ['determiner', 'lastname'],
					headers: {
						contains: [
							'determiner',
						]
					},
				}
			]
		},
	},
	synonyms: {
		Agent: {
			middleInitial: {
				suggestion: {
					headers: {
						contains: [
							'middle'
						]
					},
				},
				automapper: {
					headers: {
						formatted_header_field_synonym: [
							'middle'
						]
					},
				}
			}
		},
		CollectingEvent: {
			verbatimDate: {
				suggestion: {
					headers: {
						contains: [
							'date verbatim',
							'date collected verbatim',
						]
					},
				}
			},
			startDate: {
				suggestion: {
					headers: {
						contains: [
							'date',
							'start',
							'collected',
						]
					},
				},
			},
			endDate: {
				suggestion: {
					headers: {
						contains: [
							'end',
							'date',
						]
					},
				},
			},
			method: {
				automapper: {
					headers: {
						contains: [
							'method'
						]
					},
				}
			},
			stationfieldnumber: {
				automapper: {
					headers: {
						regex: [
							'^(coll(ect(ing)?)?) (ev(ent)?|(#|n(o|um(er)?)?)|ev(ent)? (#|n(o|um(er)?)?))',
						],
					},
				}
			}
		},
		Accession: {
			accessionnumber: {
				automapper: {
					headers: {
						regex: [
							'acc(ession)? (#|n(o|um(er)?)?)',
						],
						string: [
							'accession'
						],
					},
				}
			}
		},
		Locality: {
			maxElevation: {
				automapper: {
					headers: {
						contains: [
							'max elev',
							'max depth'
						],
					},
				}
			},
			minElevation: {
				automapper: {
					headers: {
						contains: [
							'elev',
							'depth'
						]
					},
				}
			},
			latitude1: {
				automapper: {
					headers: {
						contains: [
							'latitude 1'
						]
					},
				}
			},
			latitude2: {
				automapper: {
					headers: {
						contains: [
							'latitude 2'
						]
					},
				}
			},
			longitude1: {
				automapper: {
					headers: {
						contains: [
							'longitude 1'
						]
					},
				}
			},
			longitude2: {
				automapper: {
					headers: {
						contains: [
							'longitude 2'
						]
					},
				}
			},
			localityname: {
				automapper: {
					headers: {
						string: [
							'localitynum',
						],
					},
				}
			},
			namedplace: {
				automapper: {
					headers: {
						contains: [
							'named place',
						],
					},
				}
			},
		},
		Gift: {
			receivedComments: {
				suggestion: {
					headers: {
						contains: [
							'comments',
						]
					},
				}
			}
		},
		CollectionObject: {
			fieldNumber: {
				automapper: {
					headers: {
						contains: [
							'field #',
							'field no',
							'field num'
						]
					},
				}
			},
			catalogedDate: {
				automapper: {
					headers: {
						contains: [
							'cataloged date',
							'catalogued date'
						],
						string: [
							'cat date',
						]
					},
				}
			},
			catalogNumber: {
				automapper: {
					headers: {
						regex: [
							'specimen|cat(alog(ue)?)? ?(#|n(o|um(er)?)?)',
						],
						contains: [
							'bmsm no',
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
						]
					}
				}
			}
		},
		Geography: {
			state: {
				automapper: {
					headers: {
						contains: [
							'state',
						]
					},
				}
			},
			continent: {
				automapper: {
					headers: {
						contains: [
							'continent',
						]
					},
				}
			}
		},
		Determination: {
			determinedDate: {
				suggestion: {
					headers: {
						contains: [
							'date'
						],
					},
				},
				automapper: {
					headers: {
						formatted_header_field_synonym: [
							'date'
						]
					}
				}
			},
			typeStatusName: {
				suggestion: {
					headers: {
						contains: [
							'status'
						],
					},
				},
				automapper: {
					headers: {
						formatted_header_field_synonym: [
							'status'
						]
					}
				}
			},
		},
		PrepType: {
			name: {
				automapper: {
					headers: {
						contains: [
							'prep ',
							'preparation'
						]
					},
				}
			}
		}
	},
};

module.exports = auto_mapper_definitions;