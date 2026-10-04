// Cloudflare Worker: Jarvis brain (Gemini). Secret: GEMINI_API_KEY. Optional vars: JARVIS_MODEL, JARVIS_FALLBACKS
const SYS = "You are J.A.R.V.I.S., a smart, calm, witty voice assistant. Reply in Hinglish (Roman script), in 1-3 short spoken sentences. No markdown, no emojis.";
export default {
  async fetch(req, env) {
    const h = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: h });
    if (req.method !== "POST") return new Response(JSON.stringify({ reply: "Jarvis worker online" }), { headers: h });
    try {
      const { messages = [] } = await req.json();
      const contents = messages.slice(-9).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content).slice(0, 2000) }],
      }));
      const models = [env.JARVIS_MODEL || "gemini-2.5-flash", ...(env.JARVIS_FALLBACKS || "gemini-2.5-flash-lite").split(",")];
      for (const model of models) {
        for (let i = 0; i < 2; i++) {
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model.trim()}:generateContent`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
            body: JSON.stringify({ systemInstruction: { parts: [{ text: SYS }] }, contents }),
          });
          if (r.ok) {
            const d = await r.json();
            const reply = d.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "Kuch gadbad ho gayi, dobara bolo.";
            return new Response(JSON.stringify({ reply }), { headers: h });
          }
          await new Promise(s => setTimeout(s, 600));
        }
      }
      return new Response(JSON.stringify({ reply: "Server abhi busy hai, thodi der baad try karo." }), { headers: h });
    } catch (e) {
      return new Response(JSON.stringify({ reply: "Worker error: " + e.message }), { headers: h });
    }
  },
};
