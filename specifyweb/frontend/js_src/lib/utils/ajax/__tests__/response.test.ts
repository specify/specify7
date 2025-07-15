import { handleAjaxError } from '../../../components/Errors/FormatError';
import { xmlToString } from '../../../components/Syncer/xmlToString';
import { Http, httpCodeToErrorMessage } from '../definitions';
import { handleAjaxResponse } from '../response';

jest.mock('../../../components/Errors/FormatError', () => ({
  handleAjaxError: jest.fn(),
}));

describe('handleAjaxResponse', () => {
  test('Empty response', () => {
    const response = handleAjaxResponse<Document>({
      expectedErrors: [],
      accept: 'text/plain',
      response: new Response(undefined, {
        status: Http.NO_CONTENT,
        statusText: undefined,
      }),
      errorMode: 'visible',
      text: '',
    });
    expect(response).toEqual({
      data: '',
      response: {
        ok: true,
        status: Http.NO_CONTENT,
        statusText: '',
      },
      status: Http.NO_CONTENT,
    });
  });

  test('Plain text response', () => {
    const response = handleAjaxResponse<Document>({
      expectedErrors: [],
      accept: 'text/plain',
      response: new Response('', {
        status: Http.OK,
        statusText: undefined,
      }),
      errorMode: 'visible',
      text: 'Test response',
    });
    expect(response).toEqual({
      data: 'Test response',
      response: {
        ok: true,
        status: Http.OK,
        statusText: '',
      },
      status: Http.OK,
    });
  });

  test('JSON response', () => {
    const response = handleAjaxResponse<{ readonly foo: 'bar' }>({
      expectedErrors: [],
      accept: 'application/json',
      response: new Response('', {
        status: Http.OK,
        statusText: undefined,
      }),
      errorMode: 'visible',
      text: '{"foo": "bar"}',
    });
    expect(response).toEqual({
      data: {
        foo: 'bar',
      },
      response: {
        ok: true,
        status: Http.OK,
        statusText: '',
      },
      status: Http.OK,
    });
  });

  test('XML response', () => {
    const response = handleAjaxResponse<Document>({
      expectedErrors: [],
      accept: 'text/xml',
      response: new Response('', {
        status: Http.OK,
        statusText: undefined,
      }),
      errorMode: 'visible',
      text: '<icons type="datamodel" subdir="datamodel">test</icons>',
    });
    expect({
      ...response,
      data: xmlToString(response.data, false),
    }).toEqual({
      data: '<icons type="datamodel" subdir="datamodel">test</icons>',
      response: {
        ok: true,
        status: Http.OK,
        statusText: '',
      },
      status: Http.OK,
    });
  });

  test('Expected 404 error', () => {
    const response = handleAjaxResponse<Document>({
      expectedErrors: [Http.NOT_FOUND],
      accept: 'text/plain',
      response: new Response('', {
        status: Http.NOT_FOUND,
        statusText: undefined,
      }),
      errorMode: 'visible',
      text: 'Page not found',
    });
    expect(response).toEqual({
      data: 'Page not found',
      response: {
        ok: false,
        status: Http.NOT_FOUND,
        statusText: '',
      },
      status: Http.NOT_FOUND,
    });
  });

  test('Unexpected 503 response', () => {
    jest.spyOn(console, 'error').mockImplementation();
    handleAjaxResponse<Document>({
      expectedErrors: [Http.NOT_FOUND],
      accept: 'text/plain',
      response: new Response('', {
        status: Http.UNAVAILABLE,
        statusText: undefined,
      }),
      errorMode: 'visible',
      text: 'Service unavailable',
    });
    expect(handleAjaxError).toHaveBeenLastCalledWith(
      {
        type: 'invalidResponseCode',
        statusText: [
          `Invalid response code ${Http.UNAVAILABLE}.`,
          httpCodeToErrorMessage[Http.UNAVAILABLE],
          'Response:',
        ],
        responseText: 'Service unavailable',
      },
      { ok: false, status: Http.UNAVAILABLE, statusText: '' },
      'visible'
    );
  });

  test('Unexpected 404 response', () => {
    jest.spyOn(console, 'error').mockImplementation();
    handleAjaxResponse<Document>({
      expectedErrors: [],
      accept: 'text/plain',
      response: new Response('', {
        status: Http.NOT_FOUND,
        statusText: undefined,
      }),
      errorMode: 'visible',
      text: 'Page not found',
    });
    expect(handleAjaxError).toHaveBeenLastCalledWith(
      {
        type: 'invalidResponseCode',
        statusText: [
          `Invalid response code ${Http.NOT_FOUND}.`,
          httpCodeToErrorMessage[Http.NOT_FOUND],
          'Response:',
        ],
        responseText: 'Page not found',
      },
      { ok: false, status: Http.NOT_FOUND, statusText: '' },
      'visible'
    );
  });

  test('Permission error', () => {
    jest.spyOn(console, 'error').mockImplementation();
    handleAjaxResponse<Document>({
      expectedErrors: [],
      accept: 'text/plain',
      response: new Response('', {
        status: Http.FORBIDDEN,
        statusText: undefined,
      }),
      errorMode: 'visible',
      text: 'Not allowed',
    });
    expect(handleAjaxError).toHaveBeenLastCalledWith(
      {
        type: 'permissionDenied',
        statusText: `You don't have a permission to do this action`,
        responseText: 'Not allowed',
      },
      { ok: false, status: Http.FORBIDDEN, statusText: '' },
      'visible'
    );
  });

  test('JSON response with syntax error', () => {
    jest.spyOn(console, 'error').mockImplementation();
    handleAjaxResponse<Document>({
      expectedErrors: [],
      accept: 'application/json',
      response: new Response('', {
        status: Http.OK,
        statusText: undefined,
      }),
      errorMode: 'visible',
      text: '{',
    });
    expect(handleAjaxError).toHaveBeenLastCalledWith(
      {
        type: 'jsonParseFailure',
        statusText: `Failed parsing JSON response:`,
        responseText: '{',
      },
      { ok: true, status: Http.OK, statusText: '' },
      'visible'
    );
  });

  test('XML response with syntax error', () => {
    jest.spyOn(console, 'error').mockImplementation();
    handleAjaxResponse<Document>({
      expectedErrors: [],
      accept: 'text/xml',
      response: new Response('', {
        status: Http.OK,
        statusText: undefined,
      }),
      errorMode: 'visible',
      text: '<',
    });
    expect(handleAjaxError).toHaveBeenLastCalledWith(
      {
        type: 'xmlParseFailure',
        statusText: `Failed parsing XML response: 1:1: document must contain a root element.`,
        responseText: '<',
      },
      { ok: true, status: Http.OK, statusText: '' },
      'visible'
    );
  });
});
