export default async function handler(req, res) {
  try {
    const r = await fetch("https://remoteok.com/api?tag=design", {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
    });
    const raw = await r.json();
    const jobs = Array.isArray(raw) ? raw.filter(j => j.id && j.position) : [];
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
    res.json({ jobs });
  } catch (e) {
    res.status(500).json({ error: e.message, jobs: [] });
  }
}
