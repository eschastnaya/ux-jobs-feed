// Hacker News "Who's Hiring" — monthly thread, parsed via HN API
// Finds design/UX mentions and extracts them
export default async function handler(req, res) {
  try {
    // Get latest "Ask HN: Who is hiring?" post
    const search = await fetch(
      'https://hn.algolia.com/api/v1/search?query=Ask+HN+Who+is+hiring&tags=ask_hn&hitsPerPage=5'
    );
    const searchData = await search.json();
    
    // Find most recent hiring thread
    const hiringPost = searchData.hits?.find(h => 
      h.title?.toLowerCase().includes("who is hiring") && 
      h.title?.toLowerCase().includes("ask hn")
    );
    
    if (!hiringPost) return res.json({ jobs: [] });

    // Get comments from that post
    const comments = await fetch(
      `https://hn.algolia.com/api/v1/search?tags=comment,story_${hiringPost.objectID}&hitsPerPage=100`
    );
    const commentsData = await comments.json();

    const DESIGN_KW = ["ux", "ui designer", "product designer", "design system", "figma", "framer", "visual designer", "interaction designer", "web designer"];
    const REMOTE_KW = ["remote", "anywhere", "worldwide", "distributed"];

    const jobs = [];
    for (const c of (commentsData.hits || [])) {
      const text = c.comment_text || "";
      const plain = text.replace(/<[^>]+>/g, " ").toLowerCase();
      
      if (!DESIGN_KW.some(k => plain.includes(k))) continue;
      if (!REMOTE_KW.some(k => plain.includes(k))) continue;

      // Extract company name (usually first word/phrase before | or newline)
      const firstLine = text.replace(/<[^>]+>/g, "").split(/\n|\|/)[0].trim().slice(0, 60);
      
      // Extract URL from comment
      const urlMatch = text.match(/href="([^"]+)"/);
      const url = urlMatch ? urlMatch[1] : `https://news.ycombinator.com/item?id=${c.objectID}`;

      // Extract role title
      const roleMatch = plain.match(/(ux|ui|product|visual|interaction|web)[\s\-]*(designer|design\s*lead|researcher)[^\n,|]*/);
      const title = roleMatch ? roleMatch[0].trim().replace(/\b\w/g, l => l.toUpperCase()) : "Design Role";

      jobs.push({
        id: `hn-${c.objectID}`,
        title,
        company: firstLine || "Unknown",
        url,
        date: c.created_at,
        location: "Remote",
        salary: "",
        source: "HN Hiring",
      });
    }

    res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");
    res.json({ jobs: jobs.slice(0, 20) });
  } catch (e) {
    res.status(500).json({ error: e.message, jobs: [] });
  }
}
