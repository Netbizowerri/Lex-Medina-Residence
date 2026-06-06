// Vercel Serverless Function for CRM webhook proxy
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { webhookUrl, payload } = req.body;

  if (!webhookUrl || !payload) {
    return res.status(400).json({ error: 'Missing webhookUrl or payload' });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to send to CRM webhook',
      details: error.message 
    });
  }
}