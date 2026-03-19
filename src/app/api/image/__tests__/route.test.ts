import { describe, it, expect } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

const callGET = (params?: Record<string, string>) => {
  const url = new URL('http://localhost/api/image');
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return GET(new NextRequest(url));
};

describe('GET /api/image', () => {
  it('missing url parameter → 400 with success: false', async () => {
    const response = await callGET();
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ success: false, error: 'Missing url parameter' });
  });

  it('non-HTTPS url → 400 with success: false', async () => {
    const response = await callGET({ url: 'http://example.com/img.jpg' });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ success: false, error: 'Only HTTPS protocol is allowed' });
  });

  it('disallowed domain → 403 with success: false', async () => {
    const response = await callGET({ url: 'https://evil.com/img.jpg' });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ success: false, error: 'Domain not allowed' });
  });
});
