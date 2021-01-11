interface Action<action_name extends string> {
	type: action_name
}

interface State<state_name extends string> {
	type: state_name
}

type react_elements = JSX.Element | JSX.Element[] | string;