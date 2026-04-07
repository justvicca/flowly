export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: 'Pluggy credentials not configured' }), { status: 500 });
  }

  try {
    // 1. Obter API key
    const authRes = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    if (!authRes.ok) {
      const err = await authRes.text();
      return new Response(JSON.stringify({ error: `Auth failed: ${err}` }), { status: authRes.status });
    }

    const authData = await authRes.json() as { apiKey: string };

    // 2. Criar connect token
    const tokenRes = await fetch('https://api.pluggy.ai/connect_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': authData.apiKey,
      },
      body: JSON.stringify({}),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return new Response(JSON.stringify({ error: `Token failed: ${err}` }), { status: tokenRes.status });
    }

    const tokenData = await tokenRes.json() as { accessToken: string };
    return new Response(JSON.stringify({ accessToken: tokenData.accessToken }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
