export default async function handler(req, res) {
  try {
    const r = await fetch("https://remotive.com/api/remote-jobs?category=design&limit=100", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const data = await r.json();
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
