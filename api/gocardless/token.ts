import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secretId = process.env.GOCARDLESS_SECRET_ID;
  const secretKey = process.env.GOCARDLESS_SECRET_KEY;
  if (!secretId || !secretKey) return res.status(500).json({ error: 'GoCardless credentials not configured' });

  try {
    const authRes = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret_id: secretId, secret_key: secretKey }),
    });
    if (!authRes.ok) {
      const err = await authRes.text();
      return res.status(authRes.status).json({ error: `Auth failed: ${err}` });
    }
    const data = await authRes.json() as { access: string };
    return res.status(200).json({ access: data.access });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
