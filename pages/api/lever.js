// Lever public job board API — direct company career pages
const COMPANIES = [
  "airbnb", "netflix", "spotify", "twilio", "sendbird",
  "personio", "pleo", "wise", "revolut", "monzo",
  "figma", "robinhood", "coinbase", "opensea",
  "postman", "hashicorp", "datadog", "snyk", "benchling",
];

const DESIGN_KW = [
  "ux", "ui", "product design", "product designer", "interface",
  "interaction", "visual design", "design system", "web designer",
  "figma", "framer", "motion design", "graphic design", "brand",
  "creative", "user research",
];

function isDesign(title = "") {
  return DESIGN_KW.some(k => title.toLowerCase().includes(k));
}

export default async function handler(req, res) {
  const results = [];

  await Promise.allSettled(
    COMPANIES.map(async (company) => {
      try {
        const r = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(5000),
        });
        if (!r.ok) return;
        const jobs = await r.json();
        for (const j of (Array.isArray(jobs) ? jobs : [])) {
          if (!isDesign(j.text)) continue;
          results.push({
            id: `lv-${j.id}`,
            title: j.text,
            company: company.charAt(0).toUpperCase() + company.slice(1),
            url: j.hostedUrl,
            location: j.categories?.location || j.workplaceType || "Remote",
            date: j.createdAt ? new Date(j.createdAt).toISOString() : new Date().toISOString(),
          });
        }
      } catch (_) {}
    })
  );

  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
  res.json({ jobs: results });
}
