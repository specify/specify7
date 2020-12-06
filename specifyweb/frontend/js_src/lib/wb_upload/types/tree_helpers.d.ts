type mappings_tree_header = {
	[key in mapping_type] :string;
};

interface mappings_tree {
	[key :string] :mappings_tree | string | mappings_tree_header
}

interface flat_tree {
	[key :string] :flat_tree | string
}

/*
* Example:
* 	if
* 		array is ['accession', 'accession agents', '#1, 'agent', 'first name']
* 		has_headers is False
* 	then result is {
* 		'accession': {
* 			'accession_agents': {
* 				'#1': {
* 					'agent': {
* 						'first_name': {
*
* 						},
* 					}
* 				}
* 			}
* 		}
* 	}
*
* 	if
* 		array is ['accession', 'accession agents', '#1, 'agent', 'first name', 'existing_header', 'Agent 1 First Name']
* 		has_headers is True
* 	then result is {
* 		'accession': {
* 			'accession_agents': {
* 				'#1': {
* 					'agent': {
* 						'first_name': {
* 							'existing_header': 'Agent 1 First Name',
* 						},
* 					}
* 				}
* 			}
* 		}
* 	}
* */

type traversed_tree = string | mappings_tree | undefined | false
/*
* A cross-section of two trees
* Example:
* if full_mappings_tree is like this:
* 	Accession
* 		Accession Agents
* 			#1
* 				Agent
* 					Agent Name
* 			#2
* 				Agent
* 					Agent Type
* 					Agent Name
* 				Remarks
* And node_mappings_tree is like this:
* 	Accession
* 		Accession Agents
* 			#2
* This function will return the following object:
* 	Agent
* 		Agent Type
* 		Agent Name
* 	Remarks
* */

type merged_tree = object
/*
* For example, if target is:
* 	Accession
* 		Accession Agents
* 			#1
* 				Agent
* 				Remarks
* And source is:
* 	Accession
* 		Accession Agents
* 			#2
* 				Agent
* Resulting tree is:
* 	Accession
* 		Accession Agents
* 			#1
* 				Agent
* 					Remarks
* 			#2
* 				Agent
* */