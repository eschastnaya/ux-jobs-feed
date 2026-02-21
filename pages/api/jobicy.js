export default async function handler(req, res) {
  try {
    const r = await fetch(
      "https://jobicy.com/api/v2/remote-jobs?count=50&tag=ux-designer,ui-designer,product-designer",
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) }
    );
    const data = await r.json();
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
    res.json({ jobs: data.jobs || [] });
  } catch (e) {
    res.status(500).json({ error: e.message, jobs: [] });
  }
}
