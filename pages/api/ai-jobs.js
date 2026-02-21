export default async function handler(req, res) {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `Search for remote UX or product designer job openings in Europe or USA posted this week at tech companies.
Return ONLY a raw JSON array, no markdown, no explanation.
Each object: { title, company, url, location, salary, date }
Up to 10 real jobs. Mid/senior level. No LATAM, no Asia.`,
        }],
      }),
    });
    const data = await r.json();
    const text = (data.content || []).map(b => b.text || "").join("");
    const match = text.match(/\[[\s\S]*?\]/);
    const jobs = match ? JSON.parse(match[0]) : [];
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.json({ jobs });
  } catch (e) {
    res.status(500).json({ error: e.message, jobs: [] });
  }
}
