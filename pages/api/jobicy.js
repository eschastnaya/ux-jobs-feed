export default async function handler(req, res) {
  try {
    const r = await fetch("https://jobicy.com/api/v2/remote-jobs?industry=design&count=50", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const data = await r.json();
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message, jobs: [] });
  }
}
