export default async function handler(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(200).json({ jobs: [], error: "No API key configured" });
  }
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
        max_tokens: 2000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `Search for remote UX designer or product designer job openings posted this week at tech companies in USA or Europe. Return ONLY a raw JSON array with no markdown backticks, no explanation. Each object must have exactly these fields: title, company, url, location, salary, date. Find 8-10 real current jobs. Only design roles (UX, UI, Product Designer, Design Systems). No LATAM, no Asia, no internships.`,
        }],
      }),
    });
    const data = await r.json();
    const text = (data.content || []).map(b => b.text || "").join("");
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return res.json({ jobs: [] });
    const jobs = JSON.parse(match[0]);
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.json({ jobs: jobs.filter(j => j.title && j.company) });
  } catch (e) {
    res.status(500).json({ error: e.message, jobs: [] });
  }
}
