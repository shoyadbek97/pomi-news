export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { url, sourceName, style } = req.body;
  if (!url) return res.status(400).json({ error: 'URL kerak' });

  const stylePrompts = {
    news: "Qisqa, tezkor yangilik formatida (150-250 so'z)",
    full: "To'liq maqola formatida (400-600 so'z)",
    showbiz: "Shou-biznes maqolasi uslubida (200-350 so'z)",
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: `Siz Pomi.uz o'zbek yangiliklar saytining tajribali jurnalistidasiz.
Berilgan URL manzildan maqolani o'qib, o'zbek tilida qayta yozing.
Qoidalar:
- Faqat o'zbek tilida yozing
- "Gap shundaki," faqat bir marta
- "Muzokaralarga sabab bo'ldi" HECH QACHON ishlatmang
- Oxirida "Manba: ${sourceName}" yozing
- ${stylePrompts[style] || stylePrompts.news}
Javob faqat JSON: {"title":"...","category":"Jamiyat|Siyosat|Iqtisodiyot|Sport|Texnologiya|Shou-biznes|Dunyo","excerpt":"...","content":"...","image_keywords":"inglizcha kalit so'zlar, vergul bilan"}`,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: `Maqolani o'qi va o'zbek tiliga o'gir: ${url}` }]
      })
    });

    const data = await response.json();
    if (!data.content) throw new Error('AI javobi kelmadi');

    const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Natija tayyorlanmadi');

    res.json({ result: JSON.parse(match[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
