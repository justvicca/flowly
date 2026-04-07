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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { accountId, from, to } = req.query;
  if (!accountId || typeof accountId !== 'string') {
    return res.status(400).json({ error: 'accountId required' });
  }

  try {
    const apiKey = await getApiKey();

    let url = `https://api.pluggy.ai/transactions?accountId=${accountId}&pageSize=100`;
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;

    const response = await fetch(url, {
      headers: { 'X-API-KEY': apiKey },
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
