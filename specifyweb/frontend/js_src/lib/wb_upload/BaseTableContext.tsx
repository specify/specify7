"use strict";

const ContextCreatorWithStates = require('./ContextCreatorWithReducer.tsx');
const {assertExhaustive} = require('./StateManagement');

type SetBaseTableAction = {
	type: 'Set'
	base_table_name: string,
};
type BaseTableActions = SetBaseTableAction;

const {
	Provider:CountProvider,
	useState:useBaseTableState,
	useDispatch:useBaseTableDispatch
} = ContextCreatorWithStates(
	(_:object, action:BaseTableActions)=>{
		switch (action.type) {
			case 'Set':
				return {
					base_table_name: action.base_table_name
				};
			default:
				assertExhaustive();
		}
	},
	{count: 0}
);

export {
	CountProvider,
	useBaseTableState,
	useBaseTableDispatch
};