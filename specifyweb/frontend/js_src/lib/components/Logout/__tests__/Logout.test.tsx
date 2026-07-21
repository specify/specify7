import React from 'react'
import { overrideAjax } from '../../../tests/ajax' 
import { Http } from '../../../utils/ajax/definitions'
import { render } from '@testing-library/react'
import { Logout } from '..'



test("logout", ():void => {
	const con_err = jest.spyOn(console, 'error').mockImplementation()
	overrideAjax('/accounts/logout', {}, {method:'POST', responseCode:Http.OK})
	render(<Logout />)

	expect(con_err.mock.calls).toHaveLength(1);
})
