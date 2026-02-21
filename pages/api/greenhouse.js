const COMPANIES = [
  "figma", "linear", "vercel", "notion", "loom", "miro", "framer",
  "webflow", "coda", "pitch", "descript", "canva",
  "stripe", "brex", "plaid", "gusto", "mercury", "rippling", "ramp",
  "github", "gitlab", "retool", "segment", "amplitude", "mixpanel",
  "datadog", "cloudflare", "snyk", "postman",
  "intercom", "atlassian", "airtable", "asana", "monday",
  "hubspot", "typeform", "lattice", "contentful", "zapier",
  "superhuman", "dropbox", "duolingo", "calm",
  "anthropic", "cohere", "jasper", "runway", "synthesia", "glean",
  "shopify", "klaviyo", "carta", "deel", "remote", "dbt",
  "benchling", "lottiefiles", "maze", "dovetail",
];

const DESIGN_KW = [
  "ux", "ui", "product designer", "product design", "interface",
  "interaction designer", "visual designer", "design system",
  "web designer", "figma", "framer", "motion designer",
  "graphic designer", "brand designer", "creative director",
  "design lead", "design manager", "ux researcher", "user researcher",
  "staff designer", "principal designer",
];

const REMOTE_KW = ["remote", "anywhere", "worldwide", "distributed", "global", "work from home", "wfh"];
const LOCATION_BLOCK = ["on-site", "onsite", "on site", "in-office", "in office", "hybrid"];

function isDesign(title = "") {
  return DESIGN_KW.some(k => title.toLowerCase().includes(k));
}

function isRemote(locationName = "", jobContent = "") {
  const loc = locationName.toLowerCase();
  const content = (jobContent || "").toLowerCase().slice(0, 500);
  
  // Block clearly non-remote
  if (LOCATION_BLOCK.some(k => loc.includes(k))) return false;
  
  // Accept if location says remote
  if (REMOTE_KW.some(k => loc.includes(k))) return true;
  
  // Accept if no specific city (just country or region)
  const hasCityPattern = /,\s*(ca|ny|tx|wa|or|ma|il|co|ga|fl|uk|de|fr|nl|es|pl|it)$/i.test(locationName);
  
  // Accept USA/Europe without specific office city
  const broadLocations = ["united states", "usa", "us", "europe", "emea", "north america", ""];
  if (broadLocations.some(b => loc === b || loc.includes(b))) return true;
  
  // Check job content for remote mentions
  if (REMOTE_KW.some(k => content.includes(k))) return true;

  return false;
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
          if (!isRemote(j.location?.name || "", j.content || "")) continue;
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
