import type { VercelRequest, VercelResponse } from '@vercel/node';

async function getAccessToken(): Promise<string> {
  const secretId = process.env.GOCARDLESS_SECRET_ID;
  const secretKey = process.env.GOCARDLESS_SECRET_KEY;
  if (!secretId || !secretKey) throw new Error('GoCardless credentials not configured');

  const authRes = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret_id: secretId, secret_key: secretKey }),
  });
  if (!authRes.ok) {
    const err = await authRes.text();
    throw Object.assign(new Error(`Auth failed: ${err}`), { status: authRes.status });
  }
  const data = await authRes.json() as { access: string };
  return data.access;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { requisitionId } = req.query;
  if (!requisitionId) return res.status(400).json({ error: 'Missing required parameter: requisitionId' });

  try {
    const access = await getAccessToken();
    const reqRes = await fetch(
      `https://bankaccountdata.gocardless.com/api/v2/requisitions/${requisitionId}/`,
      { headers: { Authorization: `Bearer ${access}` } }
    );
    if (!reqRes.ok) {
      const err = await reqRes.text();
      return res.status(reqRes.status).json({ error: `Requisition fetch failed: ${err}` });
    }
    const data = await reqRes.json() as { accounts: string[] };
    return res.status(200).json(data.accounts);
  } catch (err: unknown) {
    const status = (err as { status?: number }).status ?? 500;
    return res.status(status).json({ error: String(err) });
  }
}
