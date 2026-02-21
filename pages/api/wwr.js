// WeWorkRemotely — Design & UX category RSS (no auth required)
export default async function handler(req, res) {
  try {
    const r = await fetch("https://weworkremotely.com/categories/remote-design-jobs.rss", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const xml = await r.text();

    // Parse RSS manually (no external libs needed)
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const get = (tag) => {
        const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>|<${tag}[^>]*>([^<]*)<\/${tag}>`));
        return m ? (m[1] || m[2] || "").trim() : "";
      };
      const title = get("title");
      const link = get("link") || block.match(/https?:\/\/[^\s<"]+/)?.[0] || "";
      const pubDate = get("pubDate");
      const desc = get("description").replace(/<[^>]+>/g, "").slice(0, 600);
      const region = get("region");
      const company = get("company");

      if (title && !title.toLowerCase().includes("weworkremotely")) {
        items.push({ title, link, pubDate, desc, region, company });
      }
    }

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.json({ jobs: items });
  } catch (e) {
    res.status(500).json({ error: e.message, jobs: [] });
  }
}
