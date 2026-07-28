export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url, sourceName, style } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL kerak" });
  }

  const stylePrompts = {
    news: "Qisqa, tezkor yangilik formatida (150-250 so'z)",
    full: "To'liq maqola formatida (400-600 so'z)",
    showbiz: "Shou-biznes maqolasi uslubida (200-350 so'z)",
  };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: `Siz Pomi.uz o'zbek yangiliklar saytining tajribali jurnalistidasiz.

Berilgan URL dagi maqolani o'qib, o'zbek tilida qayta yozing.

Qoidalar:
- Faqat o'zbek tilida yozing.
- "Gap shundaki," iborasini faqat bir marta ishlating.
- "Muzokaralarga sabab bo'ldi" iborasini ishlatmang.
- Oxirida "Manba: ${sourceName}" yozing.
- ${stylePrompts[style] || stylePrompts.news}

Natijani faqat JSON formatida qaytaring:

{
  "title": "",
  "category": "",
  "excerpt": "",
  "content": "",
  "image_keywords": ""
}`,
        messages: [
          {
            role: "user",
            content: `Maqolani o'qib o'zbek tilida qayta yoz:\n\n${url}`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    if (!data.content) {
      return res.status(500).json({ error: "AI javobi kelmadi" });
    }

    const text = data.content
      .filter(item => item.type === "text")
      .map(item => item.text)
      .join("");

    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(500).json({
        error: "JSON topilmadi",
        raw: text
      });
    }

    const result = JSON.parse(match[0]);

    return res.status(200).json({ result });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}
