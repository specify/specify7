import React from 'react'
import { overrideAjax } from '../../../tests/ajax' 
import { Http } from '../../../utils/ajax/definitions'
import { render } from '@testing-library/react'
import { Logout } from '..'


overrideAjax('/accounts/logout', {}, {method:'POST', responseCode:Http.OK})



test("logout", (): void => {
	const con_err = jest.spyOn(console, 'error').mockImplementation();

	//const loading = jest.fn(() => {})
	render(
	  //<LoadingContext.Provider value={loading}>
		<Logout />
	  //</LoadingContext.Provider>
	)

	expect(con_err.mock.calls).toHaveLength(1);
})
