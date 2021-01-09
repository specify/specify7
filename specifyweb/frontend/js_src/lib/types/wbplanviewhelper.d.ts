type divergence_point = number
/*
* Returns 0 if search array is empty
* Returns -1 if source array is empty or source array is smaller than the search array
* Examples:
* 	If:
* 		source is ['Accession','Accession Agents','#1','Agent','First Name'] and
* 		search is []
* 	returns 0
* 	If:
* 		source is ['Accession','Accession Agents','#1','Agent','First Name'] and
* 		search is ['Accession','Accession Agents',]
* 	returns 2
* 	If
* 		source is ['Accession','Accession Agents','#1','Agent','First Name'] and
* 		search is ['Accession','Accession Agents','#1']
* 	returns 3
* */

type duplicate_mappings = number[]
/*
* Array of duplicate indexes
* Example:
* 	if
* 		array_of_mappings is [
* 			['Accession','Accession Number','existing header,'Accession #;],
* 			['Catalog Number','existing header','cat num'],
* 			['Accession','Accession Number'],
* 		]
* 		has_headers is True
* 	then return [2]
* 	if
* 		array_of_mappings is [
* 			['Start Date'],
* 			['End Date'],
* 			['Start Date'],
* 			['Start Date'],
* 		]
* 		has_headers is False
* 	then return [2,3]
* */