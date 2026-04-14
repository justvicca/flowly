import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { link } = req.query;
  if (!link) return res.status(400).json({ error: 'Missing required parameter: link' });

  const secretId = process.env.BELVO_SECRET_ID;
  const secretKey = process.env.BELVO_SECRET_KEY;
  if (!secretId || !secretKey) return res.status(500).json({ error: 'Belvo credentials not configured' });

  try {
    const basicAuth = Buffer.from(`${secretId}:${secretKey}`).toString('base64');
    const accountsRes = await fetch(`https://sandbox.belvo.com/api/v2/accounts/?link=${link}`, {
      headers: { Authorization: `Basic ${basicAuth}` },
    });
    if (!accountsRes.ok) {
      const err = await accountsRes.text();
      return res.status(accountsRes.status).json({ error: `Accounts fetch failed: ${err}` });
    }
    const data = await accountsRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
