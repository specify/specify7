interface Action<action_name extends string> {
	type :action_name
}

interface State<state_name extends string> {
	type :state_name
}