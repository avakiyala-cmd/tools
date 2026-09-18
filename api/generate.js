export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const body = req.body;
    
    // Support both formats: {prompt, system} and {model, messages, max_tokens}
    let apiBody;
    if (body.messages) {
      // Tool sends model/messages format directly - pass through
      apiBody = {
        model: body.model || 'claude-sonnet-4-6',
        max_tokens: body.max_tokens || 2000,
        messages: body.messages
      };
      if (body.system) apiBody.system = body.system;
    } else {
      // Simple {prompt, system} format
      apiBody = {
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: body.system || 'You are a helpful business writing assistant.',
        messages: [{ role: 'user', content: body.prompt }]
      };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(apiBody)
    });

    const data = await response.json();
    
    if (data.error) return res.status(400).json({ error: data.error.message });

    // Return in the same format the tools expect
    return res.status(200).json(data);
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
