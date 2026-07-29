export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { texts, targetLang } = req.body;
  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: "'texts' massivi kerak" });
  }
  if (!['ru', 'en'].includes(targetLang)) {
    return res.status(400).json({ error: "'targetLang' ru yoki en bo'lishi kerak" });
  }

  const langName = targetLang === 'ru' ? 'Russian' : 'English';

  // Har bir matnni raqamlangan marker bilan ajratib, bitta so'rovda tarjima qilamiz
  const numbered = texts.map((txt, i) => `[[${i}]]\n${txt}`).join('\n\n');

  const models = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-2.5-flash-lite'];
  let translatedTexts = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{
                text: `Translate each numbered block below from Uzbek to ${langName}. Keep the same [[N]] markers in your output, one per block, followed by the translation only (no extra commentary, no quotes). Preserve line breaks within a block as \\n.\n\n${numbered}`
              }]
            }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
          })
        }
      );
      const data = await response.json();
      if (!response.ok) continue;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;

      // [[N]] markerlar bo'yicha ajratib olamiz
      const parts = text.split(/\[\[(\d+)\]\]/).slice(1);
      const result = new Array(texts.length).fill('');
      for (let i = 0; i < parts.length; i += 2) {
        const idx = parseInt(parts[i], 10);
        const val = (parts[i + 1] || '').trim();
        if (!Number.isNaN(idx) && idx < texts.length) result[idx] = val;
      }
      if (result.some(Boolean)) { translatedTexts = result; break; }
    } catch {
      continue;
    }
  }

  if (!translatedTexts) {
    return res.status(502).json({ error: 'Tarjima xizmati javob bermadi' });
  }

  res.json({ translations: translatedTexts });
}
