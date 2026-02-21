// Greenhouse public job board API — direct company career pages, no middleman
const COMPANIES = [
  // Design tools & dev-friendly
  "figma", "linear", "vercel", "notion", "loom", "superhuman",
  "miro", "framer", "webflow", "coda", "pitch",
  // Top tech with strong design culture
  "stripe", "intercom", "atlassian", "airtable", "asana",
  "dropbox", "zapier", "github", "gitlab", "brex",
  "plaid", "gusto", "lattice", "rippling", "mercury",
  "retool", "segment", "mixpanel", "amplitude", "contentful",
  "monday", "hubspot", "typeform", "canva", "descript",
];

const DESIGN_KW = [
  "ux", "ui", "product design", "product designer", "interface",
  "interaction", "visual design", "design system", "web designer",
  "figma", "framer", "motion design", "graphic design", "brand design",
  "creative", "user research", "ux research",
];

function isDesign(title = "") {
  return DESIGN_KW.some(k => title.toLowerCase().includes(k));
}

export default async function handler(req, res) {
  const results = [];
  
  await Promise.allSettled(
    COMPANIES.map(async (company) => {
      try {
        const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(5000),
        });
        if (!r.ok) return;
        const data = await r.json();
        const jobs = (data.jobs || []).filter(j => isDesign(j.title));
        for (const j of jobs) {
          results.push({
            id: `gh-${j.id}`,
            title: j.title,
            company: company.charAt(0).toUpperCase() + company.slice(1),
            url: j.absolute_url,
            location: j.location?.name || "Remote",
            date: j.updated_at || new Date().toISOString(),
          });
        }
      } catch (_) {}
    })
  );

  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
  res.json({ jobs: results });
}
