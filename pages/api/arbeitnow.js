export default async function handler(req, res) {
  try {
    const r = await fetch("https://arbeitnow.com/api/job-board-api?remote=true", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const data = await r.json();
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
