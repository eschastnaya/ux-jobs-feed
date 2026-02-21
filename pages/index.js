import { useState, useEffect, useCallback } from "react";
import Head from "next/head";

const DESIGN_KW = ["ux", "ui", "product designer", "figma", "design system", "interaction", "visual designer", "product design", "interface designer"];
const LOCATION_OK = ["remote", "europe", "usa", "united states", "uk", "germany", "france", "netherlands", "italy", "spain", "poland", "worldwide", "global", "anywhere", "emea", "international"];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isDesign(title = "", tags = [], cat = "") {
  return DESIGN_KW.some(k => `${title} ${tags.join(" ")} ${cat}`.toLowerCase().includes(k));
}
function isLocation(loc = "") {
  if (!loc.trim()) return true;
  return LOCATION_OK.some(k => loc.toLowerCase().includes(k));
}

async function fetchRemotive() {
  const r = await fetch("/api/remotive");
  const data = await r.json();
  return (data.jobs || [])
    .filter(j => isDesign(j.title, j.tags || [], j.category || "") && isLocation(j.candidate_required_location))
    .map(j => ({
      id: `r-${j.id}`, title: j.title, company: j.company_name,
      url: j.url, date: j.publication_date,
      location: j.candidate_required_location || "Remote",
      salary: j.salary || "", type: j.job_type || "",
      desc: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 600),
      source: "Remotive",
    }));
}

async function fetchArbeitnow() {
  const r = await fetch("/api/arbeitnow");
  const data = await r.json();
  return (data.data || [])
    .filter(j => isDesign(j.title, j.tags || []))
    .map(j => ({
      id: `a-${j.slug}`, title: j.title, company: j.company_name,
      url: j.url, date: j.created_at ? new Date(j.created_at * 1000).toISOString() : new Date().toISOString(),
      location: j.location || "Remote", salary: "",
      type: (j.job_types || []).join(", "),
      desc: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 600),
      source: "Arbeitnow",
    }));
}

async function fetchAI() {
  const r = await fetch("/api/ai-jobs");
  const data = await r.json();
  return (data.jobs || []).filter(j => j.title && j.company).map((j, i) => ({
    id: `ai-${i}`, title: j.title, company: j.company,
    url: j.url || "#", date: j.date || new Date().toISOString(),
    location: j.location || "Remote", salary: j.salary || "",
    type: "Full-time", desc: "", source: "AI Search",
  }));
}

const SRC_COLORS = { Remotive: "#C8FF3E", Arbeitnow: "#3ECFFF", "AI Search": "#FF9F3E" };

function Badge({ source }) {
  const c = SRC_COLORS[source] || "#888";
  return (
    <span style={{
      fontSize: 10, padding: "2px 7px", borderRadius: 2,
      background: c + "18", color: c, fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase",
      border: `1px solid ${c}33`,
    }}>{source}</span>
  );
}

function JobCard({ job }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 3,
        padding: "16px 20px", cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#C8FF3E44"; e.currentTarget.style.background = "#121212"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.background = "#0f0f0f"; }}
    >
      <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, color: "#C8FF3E", fontWeight: 700 }}>
              {job.company}
            </span>
            <Badge source={job.source} />
            {job.salary && (
              <span style={{ fontSize: 11, color: "#777", background: "#181818", padding: "1px 7px", borderRadius: 2 }}>
                {job.salary}
              </span>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#eee", marginBottom: 7, lineHeight: 1.3 }}>
            {job.title}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#555" }}>📍 {job.location}</span>
            {job.type && <span style={{ fontSize: 11, color: "#444" }}>{job.type}</span>}
            <span style={{ fontSize: 11, color: "#333" }}>{timeAgo(job.date)}</span>
          </div>
        </div>
        <span style={{ color: "#333", fontSize: 16, userSelect: "none", flexShrink: 0 }}>{open ? "↑" : "↗"}</span>
      </div>

      {open && (
        <div style={{ marginTop: 14, borderTop: "1px solid #181818", paddingTop: 14 }}>
          {job.desc && (
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.75, margin: "0 0 14px" }}>
              {job.desc}{job.desc.length >= 599 ? "…" : ""}
            </p>
          )}
          <a
            href={job.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: "inline-block", background: "#C8FF3E", color: "#000",
              padding: "7px 16px", fontSize: 11, fontWeight: 800,
              letterSpacing: "0.1em", textTransform: "uppercase",
              textDecoration: "none", borderRadius: 2,
            }}
          >
            Open position →
          </a>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState({});
  const [search, setSearch] = useState("");
  const [src, setSrc] = useState("all");
  const [updated, setUpdated] = useState(null);

  const setSt = (name, val) => setStatuses(s => ({ ...s, [name]: val }));

  const load = useCallback(async () => {
    setLoading(true);
    setJobs([]);
    setStatuses({ Remotive: "loading…", Arbeitnow: "loading…", "AI Search": "loading…" });

    const all = []; const seen = new Set();
    const add = (newJobs, name) => {
      let n = 0;
      for (const j of newJobs) {
        const key = `${j.company}${j.title}`.toLowerCase().replace(/\s/g, "");
        if (!seen.has(key)) { seen.add(key); all.push(j); n++; }
      }
      setJobs([...all].sort((a, b) => new Date(b.date) - new Date(a.date)));
      setSt(name, `✓ ${n} jobs`);
    };

    await Promise.allSettled([
      fetchRemotive().then(j => add(j, "Remotive")).catch(() => setSt("Remotive", "failed")),
      fetchArbeitnow().then(j => add(j, "Arbeitnow")).catch(() => setSt("Arbeitnow", "failed")),
      fetchAI().then(j => add(j, "AI Search")).catch(() => setSt("AI Search", "failed")),
    ]);

    setUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = jobs.filter(j => {
    const t = `${j.title} ${j.company}`.toLowerCase();
    return (!search || t.includes(search.toLowerCase())) && (src === "all" || j.source === src);
  });

  return (
    <>
      <Head>
        <title>UX Jobs Feed</title>
        <meta name="description" content="Remote UX/Product Designer jobs in Europe & USA" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style global jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; color: #eee; font-family: 'Space Grotesk', sans-serif; }
        input::placeholder { color: #2a2a2a; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #1e1e1e; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #131313", padding: "28px 28px 18px",
        position: "sticky", top: 0, background: "#080808", zIndex: 99,
      }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>
                UX Jobs<span style={{ color: "#C8FF3E" }}>.</span>
              </h1>
              <p style={{ fontSize: 11, color: "#2e2e2e", letterSpacing: "0.04em" }}>
                REMOTE · EUROPE & USA · {updated ? `UPDATED ${timeAgo(updated).toUpperCase()}` : "LOADING..."}
              </p>
            </div>
            <button onClick={load} disabled={loading} style={{
              background: "transparent", border: "1px solid #1e1e1e", color: loading ? "#2a2a2a" : "#555",
              padding: "7px 14px", cursor: loading ? "default" : "pointer", fontSize: 11,
              letterSpacing: "0.08em", borderRadius: 2, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
            }}>
              {loading ? "Scanning..." : "↻ Refresh"}
            </button>
          </div>

          {/* Source dots */}
          <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
            {Object.entries(statuses).map(([name, status]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: status === "failed" ? "#ff5555" : status?.startsWith("✓") ? SRC_COLORS[name] : "#333",
                  boxShadow: status?.startsWith("✓") ? `0 0 6px ${SRC_COLORS[name]}88` : "none",
                }} />
                <span style={{ fontSize: 11, color: status === "failed" ? "#ff5555" : "#333" }}>
                  {name} {status}
                </span>
              </div>
            ))}
          </div>

          {/* Search + filters */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search role or company..."
              style={{
                background: "#0d0d0d", border: "1px solid #1a1a1a", color: "#ccc",
                padding: "7px 12px", fontSize: 12, borderRadius: 2, width: 220,
                fontFamily: "'Space Grotesk', sans-serif", outline: "none",
              }}
            />
            {["all", "Remotive", "Arbeitnow", "AI Search"].map(s => (
              <button key={s} onClick={() => setSrc(s)} style={{
                background: src === s ? "#C8FF3E" : "#0d0d0d",
                color: src === s ? "#000" : "#444",
                border: `1px solid ${src === s ? "#C8FF3E" : "#1a1a1a"}`,
                padding: "6px 12px", cursor: "pointer", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 2,
                fontFamily: "'Space Grotesk', sans-serif", transition: "all 0.15s",
              }}>{s}</button>
            ))}
            <span style={{ fontSize: 11, color: "#2a2a2a", marginLeft: "auto" }}>
              {!loading && `${displayed.length} positions`}
            </span>
          </div>
        </div>
      </div>

      {/* Job list */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 28px 60px" }}>
        {loading && jobs.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{
              width: 28, height: 28, border: "2px solid #1a1a1a", borderTopColor: "#C8FF3E",
              borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px",
            }} />
            <p style={{ fontSize: 12, color: "#2a2a2a", letterSpacing: "0.08em" }}>SCANNING JOB BOARDS...</p>
          </div>
        )}

        {!loading && displayed.length === 0 && jobs.length > 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", fontSize: 13, color: "#333" }}>
            No results. Try clearing the search.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {displayed.map((job, i) => (
            <div key={job.id} style={{ animation: `fadein 0.2s ease ${Math.min(i * 0.025, 0.5)}s both` }}>
              <JobCard job={job} />
            </div>
          ))}
        </div>

        {displayed.length > 0 && (
          <p style={{ textAlign: "center", marginTop: 40, fontSize: 10, color: "#1a1a1a", letterSpacing: "0.06em" }}>
            SOURCES: REMOTIVE · ARBEITNOW · AI SEARCH
          </p>
        )}
      </div>
    </>
  );
}
