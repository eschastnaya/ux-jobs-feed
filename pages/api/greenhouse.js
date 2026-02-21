const COMPANIES = [
  // Design tools
  "figma", "linear", "vercel", "notion", "loom", "miro", "framer",
  "webflow", "coda", "pitch", "descript", "canva", "overflow",
  // Fintech
  "stripe", "brex", "plaid", "gusto", "mercury", "rippling",
  "wise", "ramp", "moderntreasury", "unit", "lithic",
  // Dev tools & infra  
  "github", "gitlab", "retool", "segment", "amplitude", "mixpanel",
  "datadog", "cloudflare", "hashicorp", "snyk", "postman",
  // SaaS / B2B
  "intercom", "atlassian", "airtable", "asana", "monday",
  "hubspot", "typeform", "lattice", "contentful", "zapier",
  "superhuman", "front", "missive", "craft", "linear",
  // Consumer / growth
  "dropbox", "duolingo", "calm", "headspace", "strava",
  "peloton", "bumble", "hinge", "houseparty",
  // AI / new wave
  "anthropic", "cohere", "jasper", "runway", "synthesia",
  "moveworks", "glean", "adept", "inflection",
  // E-commerce / marketplace
  "shopify", "klaviyo", "yotpo", "gorgias", "rebuy",
  // Other strong design cultures
  "benchling", "carta", "deel", "remote", "dbt",
];

const DESIGN_KW = [
  "ux", "ui", "product designer", "product design", "interface",
  "interaction designer", "visual designer", "design system",
  "web designer", "figma", "framer", "motion designer",
  "graphic designer", "brand designer", "creative director",
  "design lead", "design manager", "ux researcher", "user researcher",
  "staff designer", "principal designer",
];

function isDesign(title = "") {
  return DESIGN_KW.some(k => title.toLowerCase().includes(k));
}

export default async function handler(req, res) {
  const results = [];
  await Promise.allSettled(
    COMPANIES.map(async (company) => {
      try {
        const r = await fetch(
          `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`,
          { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(5000) }
        );
        if (!r.ok) return;
        const data = await r.json();
        for (const j of (data.jobs || [])) {
          if (!isDesign(j.title)) continue;
          results.push({
            id: `gh-${j.id}`,
            title: j.title,
            company: data.name || company.charAt(0).toUpperCase() + company.slice(1),
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
