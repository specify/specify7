//This file contains information to help auto-map imported XLS and CSV files to the Sp6 datamodel
//Based on https//github.com/specify/specify6/blob/master/config/datamodel_automappings.xml
//Matching is case insensitive. Table and field names are case insensitive

//SCHEMA:
//Table Name > Field Name > options > value
//	Available options:
//		regex - Regex string (header.match(regex))
//		string - Equals string (header===string)
//		contains - Contains string (header.indexOf(string)!==-1)



module.exports = {
	"CollectingEvent": {
		"startDate": {
			"regex": [
				".*?collected.*"
			],
			"contains": [
				"date",
				"start"
			]
		},
		"endDate": {
			"contains": [
				"end"
			]
		}
	},
	"Accession": {
		"number": {
			"contains": [
				"accession"
			]
		}
	},
	"Locality": {
		"maxElevation": {
			"regex": [
				".*?max\\s*elev.*"
			]
		},
		"minElevation": {
			"contains": [
				"elev"
			]
		}
	},
	"CollectionObject": {
		"fieldNumber": {
			"regex": [
				"^field\\s*(no|num).*"
			]
		},
		"catalogedDate": {
			"contains": [
				"cataloged",
				"catalogued"
			]
		},
		"catalogNumber": {
			"regex": [
				"^catalog(ue)?\\s*(no|num).*",
				"^cat(ue)?\\s*(no|num).*"],
			"string": [
				"number",
				"num"
			]
		}
	}
}