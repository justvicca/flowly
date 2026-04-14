import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { link, date_from, date_to } = req.query;
  if (!link) return res.status(400).json({ error: 'Missing required parameter: link' });
  if (!date_from) return res.status(400).json({ error: 'Missing required parameter: date_from' });
  if (!date_to) return res.status(400).json({ error: 'Missing required parameter: date_to' });

  const secretId = process.env.BELVO_SECRET_ID;
  const secretKey = process.env.BELVO_SECRET_KEY;
  if (!secretId || !secretKey) return res.status(500).json({ error: 'Belvo credentials not configured' });

  try {
    const basicAuth = Buffer.from(`${secretId}:${secretKey}`).toString('base64');
    const url = `https://sandbox.belvo.com/api/v2/transactions/?link=${link}&value_date__gte=${date_from}&value_date__lte=${date_to}`;
    const txRes = await fetch(url, {
      headers: { Authorization: `Basic ${basicAuth}` },
    });
    if (!txRes.ok) {
      const err = await txRes.text();
      return res.status(txRes.status).json({ error: `Transactions fetch failed: ${err}` });
    }
    const data = await txRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
