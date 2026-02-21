import { useState, useEffect, useCallback } from "react";
import Head from "next/head";

const DESIGN_KW = [
  "ux", "ui designer", "ui/ux", "product designer", "product design",
  "interaction designer", "visual designer", "design system", "web designer",
  "figma", "framer", "motion designer", "graphic designer", "brand designer",
  "creative director", "design lead", "design manager", "ux researcher",
  "user researcher", "staff designer", "principal designer",
];

const LOCATION_BLOCK = [
  "latam", "latin america", "argentina", "brazil", "mexico",
  "india", "philippines", "indonesia", "china", "singapore",
  "taiwan", "hong kong", "japan", "korea", "australia", "new zealand",
];

function isDesign(title = "") {
  return DESIGN_KW.some(k => title.toLowerCase().includes(k));
}

function isLocationOk(loc = "") {
  const l = loc.toLowerCase();
  return !LOCATION_BLOCK.some(b => l.includes(b));
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (isNaN(diff) || diff < 0) return "recent";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SRC_COLORS = {
  "Greenhouse": "#C8FF3E",
  "Lever":      "#3ECFFF",
  "Jobicy":     "#FF9F3E",
  "HN Hiring":  "#FF6B6B",
};

async function fetchJobicy() {
  const r = await fetch("/api/jobicy");
  const data = await r.json();
  return (data.jobs || [])
    .filter(j => isDesign(j.jobTitle) && isLocationOk(j.jobGeo || ""))
    .map(j => ({
      id: `jc-${j.id}`,
      title: j.jobTitle,
      company: j.companyName,
      url: j.url,
      date: j.pubDate || new Date().toISOString(),
      location: j.jobGeo || "Remote",
      salary: j.annualSalaryMin && j.annualSalaryMax
        ? `$${Math.round(j.annualSalaryMin/1000)}k–$${Math.round(j.annualSalaryMax/1000)}k`
        : "",
      type: j.jobType || "Remote",
      desc: (j.jobExcerpt || "").replace(/<[^>]+>/g, "").slice(0, 600),
      source: "Jobicy",
    }));
}

async function fetchGreenhouse() {
  const r = await fetch("/api/greenhouse");
  const data = await r.json();
  return (data.jobs || [])
    .filter(j => isLocationOk(j.location || ""))
    .map(j => ({ ...j, type: "Full-time", desc: "", source: "Greenhouse", salary: "" }));
}

async function fetchLever() {
  const r = await fetch("/api/lever");
  const data = await r.json();
  return (data.jobs || [])
    .filter(j => isLocationOk(j.location || ""))
    .map(j => ({ ...j, type: "Full-time", desc: "", source: "Lever", salary: "" }));
}

async function fetchHN() {
  const r = await fetch("/api/hn");
  const data = await r.json();
  return (data.jobs || []).map(j => ({ ...j, type: "Remote", desc: "", salary: "" }));
}

function Badge({ source }) {
  const c = SRC_COLORS[source] || "#888";
  return (
    <span style={{
      fontSize: 10, padding: "2px 7px", borderRadius: 2,
      background: c + "15", color: c, fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase",
      border: `1px solid ${c}30`, whiteSpace: "nowrap",
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
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#C8FF3E40"; e.currentTarget.style.background = "#121212"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.background = "#0f0f0f"; }}
    >
      <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#C8FF3E", fontWeight: 700 }}>{job.company}</span>
            <Badge source={job.source} />
            {job.salary && (
              <span style={{ fontSize: 11, color: "#777", background: "#181818", padding: "1px 8px", borderRadius: 2 }}>
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
            <span style={{ fontSize: 11, color: "#2e2e2e" }}>{timeAgo(job.date)}</span>
          </div>
        </div>
        <span style={{ color: "#2e2e2e", fontSize: 16, userSelect: "none", flexShrink: 0, marginTop: 2 }}>
          {open ? "↑" : "↗"}
        </span>
      </div>

      {open && (
        <div style={{ marginTop: 14, borderTop: "1px solid #181818", paddingTop: 14 }}>
          {job.desc && (
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.75, margin: "0 0 14px", fontFamily: "system-ui" }}>
              {job.desc}{job.desc.length >= 599 ? "…" : ""}
            </p>
          )}
          <a
            href={job.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: "inline-block", background: "#C8FF3E", color: "#000",
              padding: "8px 18px", fontSize: 11, fontWeight: 800,
              letterSpacing: "0.1em", textTransform: "uppercase",
              textDecoration: "none", borderRadius: 2,
            }}
          >Apply directly →</a>
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
    setStatuses({ Greenhouse: "loading…", Lever: "loading…", Jobicy: "loading…", "HN Hiring": "loading…" });

    const all = []; const seen = new Set();
    const add = (newJobs, name) => {
      let n = 0;
      for (const j of newJobs) {
        const key = `${j.company}${j.title}`.toLowerCase().replace(/\W/g, "");
        if (!seen.has(key)) { seen.add(key); all.push(j); n++; }
      }
      setJobs([...all].sort((a, b) => new Date(b.date) - new Date(a.date)));
      setSt(name, `✓ ${n}`);
    };

    await Promise.allSettled([
      fetchGreenhouse().then(j => add(j, "Greenhouse")).catch(() => setSt("Greenhouse", "failed")),
      fetchLever().then(j => add(j, "Lever")).catch(() => setSt("Lever", "failed")),
      fetchJobicy().then(j => add(j, "Jobicy")).catch(() => setSt("Jobicy", "failed")),
      fetchHN().then(j => add(j, "HN Hiring")).catch(() => setSt("HN Hiring", "failed")),
    ]);

    setUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = jobs.filter(j => {
    const t = `${j.title} ${j.company}`.toLowerCase();
    return (!search || t.includes(search.toLowerCase())) && (src === "all" || j.source === src);
  });

  const sources = ["all", "Greenhouse", "Lever", "Jobicy", "HN Hiring"];

  return (
    <>
      <Head>
        <title>UX Jobs Feed</title>
        <meta name="description" content="Remote UX/Product Designer jobs — direct from company career pages" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      <style global jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; color: #eee; font-family: 'Space Grotesk', sans-serif; }
        input { outline: none; }
        input::placeholder { color: #252525; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #1e1e1e; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>

      <div style={{ borderBottom: "1px solid #111", padding: "24px 24px 16px", position: "sticky", top: 0, background: "#080808", zIndex: 99 }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 3 }}>
                UX Jobs<span style={{ color: "#C8FF3E" }}>.</span>
              </h1>
              <p style={{ fontSize: 10, color: "#252525", letterSpacing: "0.05em" }}>
                REMOTE · EUROPE & USA · DIRECT APPLY · NO ACCOUNTS · {updated ? `UPDATED ${timeAgo(updated).toUpperCase()}` : "LOADING..."}
              </p>
            </div>
            <button onClick={load} disabled={loading} style={{
              background: "transparent", border: "1px solid #1a1a1a", color: loading ? "#222" : "#444",
              padding: "6px 14px", cursor: loading ? "default" : "pointer", fontSize: 10,
              letterSpacing: "0.08em", borderRadius: 2, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            }}>{loading ? "SCANNING..." : "↻ REFRESH"}</button>
          </div>

          <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
            {Object.entries(statuses).map(([name, status]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: status === "failed" ? "#ff4444" : status?.startsWith("✓") ? SRC_COLORS[name] : "#2a2a2a",
                  boxShadow: status?.startsWith("✓") ? `0 0 5px ${SRC_COLORS[name]}` : "none",
                }} />
                <span style={{ fontSize: 10, color: status === "failed" ? "#ff4444" : "#2e2e2e", letterSpacing: "0.04em" }}>
                  {name.toUpperCase()} {status}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search title or company..."
              style={{
                background: "#0d0d0d", border: "1px solid #181818", color: "#bbb",
                padding: "7px 12px", fontSize: 12, borderRadius: 2, width: 220,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            />
            {sources.map(s => (
              <button key={s} onClick={() => setSrc(s)} style={{
                background: src === s ? "#C8FF3E" : "#0d0d0d",
                color: src === s ? "#000" : "#3a3a3a",
                border: `1px solid ${src === s ? "#C8FF3E" : "#181818"}`,
                padding: "6px 11px", cursor: "pointer", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.07em", textTransform: "uppercase", borderRadius: 2,
                fontFamily: "'Space Grotesk', sans-serif", transition: "all 0.1s",
              }}>{s}</button>
            ))}
            <span style={{ fontSize: 10, color: "#1e1e1e", marginLeft: "auto", letterSpacing: "0.04em" }}>
              {!loading && `${displayed.length} POSITIONS`}
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "18px 24px 60px" }}>
        {loading && jobs.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 26, height: 26, border: "2px solid #1a1a1a", borderTopColor: "#C8FF3E", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ fontSize: 11, color: "#222", letterSpacing: "0.1em" }}>SCANNING COMPANY CAREER PAGES...</p>
          </div>
        )}
        {!loading && displayed.length === 0 && jobs.length > 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", fontSize: 13, color: "#2e2e2e" }}>
            No results. Try clearing the search.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {displayed.map((job, i) => (
            <div key={job.id} style={{ animation: `fadein 0.2s ease ${Math.min(i * 0.02, 0.4)}s both` }}>
              <JobCard job={job} />
            </div>
          ))}
        </div>
        {displayed.length > 0 && (
          <p style={{ textAlign: "center", marginTop: 48, fontSize: 10, color: "#151515", letterSpacing: "0.06em" }}>
            GREENHOUSE · LEVER · JOBICY · HN HIRING · NO ACCOUNTS NEEDED · $0/MONTH
          </p>
        )}
      </div>
    </>
  );
}
