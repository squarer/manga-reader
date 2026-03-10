import { describe, it, expect } from 'vitest';
import { parseResponseError } from './useFetch';

describe('parseResponseError', () => {
  it('JSON body with error field returns that error', async () => {
    const res = new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      statusText: 'Not Found',
    });
    expect(await parseResponseError(res)).toBe('Not Found');
  });

  it('JSON body with message field returns that message', async () => {
    const res = new Response(JSON.stringify({ message: 'Server error' }), {
      status: 500,
      statusText: 'Internal Server Error',
    });
    expect(await parseResponseError(res)).toBe('Server error');
  });

  it('HTML body (non-parseable JSON) uses statusText', async () => {
    const res = new Response('<html>Error</html>', {
      status: 503,
      statusText: 'Service Unavailable',
    });
    expect(await parseResponseError(res)).toBe('Service Unavailable');
  });

  it('empty body with empty statusText falls back to HTTP {status}', async () => {
    const res = new Response('', { status: 500, statusText: '' });
    expect(await parseResponseError(res)).toBe('HTTP 500');
  });

  it('JSON body with no error/message uses statusText', async () => {
    const res = new Response(JSON.stringify({ code: 42 }), {
      status: 400,
      statusText: 'Bad Request',
    });
    expect(await parseResponseError(res)).toBe('Bad Request');
  });

  it('JSON body with no error/message and empty statusText falls back to HTTP {status}', async () => {
    const res = new Response(JSON.stringify({ code: 42 }), {
      status: 400,
      statusText: '',
    });
    expect(await parseResponseError(res)).toBe('HTTP 400');
  });

  it('JSON body with both error and message prioritizes error', async () => {
    const res = new Response(JSON.stringify({ error: 'Error msg', message: 'Message msg' }), {
      status: 400,
      statusText: 'Bad Request',
    });
    expect(await parseResponseError(res)).toBe('Error msg');
  });

  it('JSON body with empty string error falls through to message', async () => {
    const res = new Response(JSON.stringify({ error: '', message: 'Fallback msg' }), {
      status: 400,
      statusText: 'Bad Request',
    });
    expect(await parseResponseError(res)).toBe('Fallback msg');
  });
});
