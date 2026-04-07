export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const accountId = url.searchParams.get('accountId');
  const from = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';

  if (!accountId) {
    return new Response(JSON.stringify({ error: 'accountId required' }), { status: 400 });
  }

  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: 'Pluggy credentials not configured' }), { status: 500 });
  }

  try {
    const authRes = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    const authData = await authRes.json() as { apiKey: string };

    let apiUrl = `https://api.pluggy.ai/transactions?accountId=${accountId}&pageSize=100`;
    if (from) apiUrl += `&from=${from}`;
    if (to) apiUrl += `&to=${to}`;

    const res = await fetch(apiUrl, {
      headers: { 'X-API-KEY': authData.apiKey },
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
