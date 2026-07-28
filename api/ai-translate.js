export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url, sourceName = "Manba", style = "news" } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL kerak" });
    }

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
        messages: [
          {
            role: "user",
            content: `Quyidagi maqolani o'qib, o'zbek tilida qayta yoz.

URL:
${url}

Qoidalar:
- Faqat JSON qaytar.
- title
- category
- excerpt
- content
- image_keywords
- Oxirida "Manba: ${sourceName}" yoz.`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: data.error?.message || "Claude API xatosi"
      });
    }

    const text = data.content?.[0]?.text || "";

    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(500).json({
        error: "Claude JSON qaytarmadi"
      });
    }

    return res.status(200).json({
      result: JSON.parse(match[0])
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}
