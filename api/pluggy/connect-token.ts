import type { VercelRequest, VercelResponse } from '@vercel/node';

async function getApiKey(): Promise<string> {
  const clientId = process.env.PLUGGY_CLIENT_ID!;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET!;

  const res = await fetch('https://api.pluggy.ai/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  });

  const data = await res.json() as { apiKey: string };
  return data.apiKey;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = await getApiKey();

    // Cria um connect token para o widget do Pluggy
    const response = await fetch('https://api.pluggy.ai/connect_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json() as { accessToken: string };
    return res.status(200).json({ accessToken: data.accessToken });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
