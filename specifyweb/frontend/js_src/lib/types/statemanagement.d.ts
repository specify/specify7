type generate_reducer_dictionary<
	STATE,
	ACTION extends Action<string>,
> = {
	[action_type in ACTION['type']] :(state:STATE, action :Extract<ACTION,Action<action_type>>) => STATE
}

type generate_dispatch_dictionary<
	ACTION extends Action<string>,
> = {
	[action_type in ACTION['type']] :(action :Extract<ACTION,Action<action_type>>) => void
}