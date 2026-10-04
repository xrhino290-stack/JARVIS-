export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return new Response('JARVIS online', { headers: cors });

    const { message, history = [] } = await req.json();
    const MODEL = 'gemini-2.5-flash';

    const contents = [
      ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: 'You are J.A.R.V.I.S., a calm, witty AI assistant like in Iron Man. Reply in Hinglish, in 1-2 short sentences, and address the user as "sir".' }]
          },
          contents
        })
      }
    );

    const d = await r.json();
    const reply = d.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';

    return new Response(JSON.stringify({ reply }), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
};
