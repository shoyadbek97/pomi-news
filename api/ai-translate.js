export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { url, sourceName, style } = req.body;
  if (!url) return res.status(400).json({ error: 'URL kerak' });

  const stylePrompts = {
    news: "Qisqa, tezkor yangilik formatida (150-250 so'z)",
    full: "To'liq maqola formatida (400-600 so'z), bir nechta xatboshi bilan",
    showbiz: "Shou-biznes maqolasi uslubida, yengil va qiziqarli tilda (200-350 so'z)",
  };

  const prompt = `Siz Pomi.uz o'zbek yangiliklar saytining tajribali jurnalistidasiz.
Quyidagi havolaga kirib maqolani o'qing va o'zbek tilida qayta yozing.

Qoidalar:
- Faqat o'zbek tilida yozing
- "Gap shundaki," faqat bir marta ishlatilsin
- "Muzokaralarga sabab bo'ldi" HECH QACHON ishlatmang
- Oxirida "Manba: ${sourceName || 'Xorijiy manba'}" yozing
- ${stylePrompts[style] || stylePrompts.news}

Havola: ${url}

Javob FAQAT shu JSON formatida bo'lsin, boshqa hech narsa yozma:
{
  "title": "sarlavha",
  "category": "Jamiyat yoki Siyosat yoki Iqtisodiyot yoki Sport yoki Texnologiya yoki Shou-biznes yoki Dunyo",
  "excerpt": "1-2 jumlali qisqacha mazmun",
  "content": "to'liq maqola matni, xatboshilar newline bilan ajratilgan",
  "image_keywords": "2-3 inglizcha kalit so me'z vergul bilan, rasm qidirish uchun"
}`;

  // Faqat real va barqaror ishlaydigan Gemini modellar ro'yxati
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-1.0-pro'
  ];

  let lastError = '';

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        lastError = data.error?.message || `${model} xatosi`;
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) { lastError = 'Javob kelmadi'; continue; }

      const match = text.replace(/```json|```/g, '').match(/\{[\s\S]*\}/);
      if (!match) { lastError = 'JSON topilmadi'; continue; }

      return res.json({ result: JSON.parse(match[0]), model });

    } catch (err) {
      lastError = err.message;
    }
  }

  res.status(500).json({ error: lastError || 'Barcha modellar ishlamadi' });
}
