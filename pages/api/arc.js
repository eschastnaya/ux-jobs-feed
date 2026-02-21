// Arc.dev — remote-only, senior designers, good rates
// They use Greenhouse under the hood
export default async function handler(req, res) {
  try {
    const r = await fetch(
      "https://boards-api.greenhouse.io/v1/boards/arc/jobs?content=true",
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(6000) }
    );
    
    if (!r.ok) {
      // Fallback: try their public jobs page API
      const r2 = await fetch("https://arc.dev/api/jobs?role=designer&remote=true", {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(5000),
      });
      if (!r2.ok) return res.json({ jobs: [] });
      const data2 = await r2.json();
      return res.json({ jobs: data2.jobs || [] });
    }

    const data = await r.json();
    const DESIGN_KW = ["ux", "ui", "product designer", "design system", "visual designer", "interaction", "figma", "framer"];
    
    const jobs = (data.jobs || [])
      .filter(j => DESIGN_KW.some(k => j.title.toLowerCase().includes(k)))
      .map(j => ({
        id: `arc-${j.id}`,
        title: j.title,
        company: "Arc.dev",
        url: j.absolute_url,
        location: "Remote",
        date: j.updated_at || new Date().toISOString(),
      }));

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
    res.json({ jobs });
  } catch (e) {
    res.status(500).json({ error: e.message, jobs: [] });
  }
}
