import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { accountId, from, to } = req.query;
  if (!accountId || typeof accountId !== 'string') return res.status(400).json({ error: 'accountId required' });

  const clientId = process.env.PLUGGY_CLIENT_ID!;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET!;

  try {
    const authRes = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    const { apiKey } = await authRes.json() as { apiKey: string };

    let url = `https://api.pluggy.ai/transactions?accountId=${accountId}&pageSize=100`;
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;

    const r = await fetch(url, { headers: { 'X-API-KEY': apiKey } });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
