export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Sarlavha kerak' });

  const models = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-2.5-flash-lite'];

  let keywords = '';

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
              parts: [{ text: `Extract 3 short English keywords for an image search from this Uzbek news headline. Return ONLY the keywords separated by commas, nothing else.\n\nHeadline: "${title}"` }]
            }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 50 }
          })
        }
      );
      const data = await response.json();
      if (!response.ok) continue;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) { keywords = text; break; }
    } catch { continue; }
  }

  // Agar Gemini ishlamasa, sarlavhani inglizchaga oddiy tarjima qilamiz
  if (!keywords) {
    const wordMap = {
      'yangilik': 'news', 'prezident': 'president', 'vazirlar': 'ministers',
      'iqtisodiyot': 'economy', 'sport': 'sport', 'futbol': 'football',
      'texnologiya': 'technology', 'tibbiyot': 'medicine', 'ta\'lim': 'education',
      'siyosat': 'politics', 'jamiyat': 'society', 'dunyo': 'world',
      'o\'zbekiston': 'uzbekistan', 'toshkent': 'tashkent', 'samarqand': 'samarkand',
      'musiqa': 'music', 'kino': 'cinema', 'san\'at': 'art', 'madaniyat': 'culture',
      'harbiy': 'military', 'urush': 'war', 'tinchlik': 'peace', 'kelishuv': 'agreement',
      'investitsiya': 'investment', 'biznes': 'business', 'moliya': 'finance',
      'temperatura': 'weather', 'ob\'havo': 'weather', 'zilzila': 'earthquake',
      'saylov': 'election', 'qonun': 'law', 'sud': 'court', 'politsiya': 'police',
      'shifoxona': 'hospital', 'maktab': 'school', 'universitet': 'university',
      'avtomobil': 'car', 'yo\'l': 'road', 'temir': 'railway', 'aviatsiya': 'aviation',
    };
    const words = title.toLowerCase().split(/\s+/);
    const translated = words
      .map(w => wordMap[w] || null)
      .filter(Boolean)
      .slice(0, 3);
    keywords = translated.length > 0 ? translated.join(',') : title.split(' ').slice(0, 3).join(',');
  }

  const imageUrl = `https://source.unsplash.com/1200x720/?${encodeURIComponent(keywords)}&t=${Date.now()}`;
  res.json({ imageUrl, keywords });
}
