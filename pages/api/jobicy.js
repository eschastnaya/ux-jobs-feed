// Jobicy — free remote jobs API, no auth, direct apply links
export default async function handler(req, res) {
  try {
    const r = await fetch("https://jobicy.com/api/v2/remote-jobs?count=50&industry=design", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const data = await r.json();
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
    res.json({ jobs: data.jobs || [] });
  } catch (e) {
    res.status(500).json({ error: e.message, jobs: [] });
  }
}
