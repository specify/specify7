interface generate_dispatch<
	STATE extends State<string>,
	ACTION extends Action<string>
> {
	<NEW_STATE extends State<string>>(obj :generate_reducer_dictionary<STATE, ACTION, NEW_STATE>):
		(state:STATE, key :ACTION) => NEW_STATE
}


type generate_reducer_dictionary<
	STATE extends State<string>,
	ACTION extends Action<string>,
	NEW_STATE extends State<string>,
> = Record<
	ACTION['type'],
	(state:STATE, key:ACTION) => NEW_STATE
>

interface generate_reducer<
	STATE extends State<string>,
	ACTION extends Action<string>
> {
	<NEW_STATE extends State<string>>(obj :generate_reducer_dictionary<STATE, ACTION, NEW_STATE>):
		(state:STATE, key :ACTION) => void
}


type generate_mutable_reducer_dictionary<
	ACTION extends Action<string>,
> = Record<
	ACTION['type'],
	(key:ACTION) => void
	// (key:Action<ACTION['type']>) => void
>

interface generate_mutable_reducer<
	ACTION extends Action<string>
> {
	(obj :generate_mutable_reducer_dictionary<ACTION>):
		(key :ACTION) => void
}