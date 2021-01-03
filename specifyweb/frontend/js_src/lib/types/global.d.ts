interface Action<action_name extends string> {
	type :action_name
}

interface State<state_name extends string> {
	type :state_name
}

type react_element = JSX.Element;
type react_elements = react_element | react_element[] | string;

type WritableDictionary<VALUE> = {
	[key:string]:VALUE
}

type Dictionary<VALUE> = Readonly<WritableDictionary<VALUE>>