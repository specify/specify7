interface ReactBackboneExtendProps<CONSTRUCTOR_PROPS,BACKBONE_PROPS,COMPONENT_PROPS> {
	module_name: string,
	class_name: string,
	initialize: (self:BACKBONE_PROPS, view_props: CONSTRUCTOR_PROPS) => void,
	render_pre?: (self:BACKBONE_PROPS) => void,
	render_post?: (self:BACKBONE_PROPS) => void,
	remove?: (self:BACKBONE_PROPS) => void,
	Component: (props:COMPONENT_PROPS)=>JSX.Element,
	get_component_props: (self:BACKBONE_PROPS)=>COMPONENT_PROPS
}

interface ReactBackboneExtendBaseProps {
	el: HTMLElement,
	remove: ()=>void,
}