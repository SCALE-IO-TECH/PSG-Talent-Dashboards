// ===== GIDs =====
const STATUS_GID = "1256252635";
const LIVE_ROLES_GID = "0";
const NEW_STARTERS_GID = "2080311953";
const CANDIDATE_SOURCES_GID = "1950940614";

// Published CSV endpoint (gid-based)
const PUB_BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRI6ijLxl_6gvJVxsLK7ChUyJOcDmpeVg0hkSAYgLSsgTzeuoHQyVrMq77afuJ1YfLwtOUAKwfNGqkJ/pub?output=csv&gid=";

// ===== CSV PARSER =====
function csvToRows(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inQuotes && next === '"') { cur += '"'; i++; continue; }
    if (ch === '"') { inQuotes = !inQuotes; continue; }

    if (ch === "," && !inQuotes) { row.push(cur); cur = ""; continue; }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cur); cur = "";
      if (row.some(v => String(v).trim() !== "")) rows.push(row);
      row = []; continue;
    }

    cur += ch;
  }

  row.push(cur);
  if (row.some(v => String(v).trim() !== "")) rows.push(row);
  return rows;
}

function toNumber(v) {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function stageClass(stage) {
  const s = String(stage || "").trim().toLowerCase();
  if (s === "offer") return "offer";
  if (s === "hired") return "hired";
  return "";
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[m]));
}

async function fetchCsvByGid(gid) {
  const url = PUB_BASE + gid + "&t=" + Date.now();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch gid=${gid}`);
  return res.text();
}

function pickIndex(headers, candidates) {
  const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, "_");
  const H = headers.map(norm);
  for (const c of candidates) {
    const i = H.indexOf(norm(c));
    if (i >= 0) return i;
  }
  return -1;
}

// ===== STATUS KPI BAR =====
async function loadStatusKpis() {
  const text = await fetchCsvByGid(STATUS_GID);
  const rows = csvToRows(text.trim());
  if (rows.length < 2) throw new Error("Status tab has no data");

  const headers = rows.shift().map(h => String(h).trim());
  const dataRow = rows.find(r => r.some(v => String(v).trim() !== "")) || [];

  const idx = (name) => headers.indexOf(name);

  document.getElementById("kpiLiveRoles").textContent = String(toNumber(dataRow[idx("Live_Roles")]));
  document.getElementById("kpiOnHold").textContent  = String(toNumber(dataRow[idx("On_Hold")]));
  document.getElementById("kpiOffers").textContent  = String(toNumber(dataRow[idx("Offers")]));
  document.getElementById("kpiHires").textContent   = String(toNumber(dataRow[idx("Hires")]));
}

// ===== LIVE ROLES LIST =====
async function loadLiveRoles() {
  const text = await fetchCsvByGid(LIVE_ROLES_GID);
  const rows = csvToRows(text.trim());
  if (rows.length < 2) throw new Error("Live roles tab has no data");

  const headers = rows.shift().map(h => String(h).trim());
  const idx = (name) => headers.indexOf(name);

  const list = document.getElementById("liveRolesList");
  if (!list) return;
  list.innerHTML = "";

  rows.forEach(r => {
    const title = (r[idx("Job_Title")] ?? "").trim();
    if (!title) return;

    const team = (r[idx("Team")] ?? "").trim();
    const location = (r[idx("Location")] ?? "").trim();
    const applicants = toNumber(r[idx("Applicants")]);
    const stage = (r[idx("Current_Stage")] ?? "").trim();

    const el = document.createElement("div");
    el.className = "row";
    el.innerHTML = `
      <div style="min-width:0;">
        <div class="title">${esc(title)}</div>
        <div class="meta">
          ${team ? `<span>${esc(team)}</span>` : ``}
          ${location ? `<span class="pill">${esc(location)}</span>` : ``}
          <span>${applicants} applicants</span>
        </div>
      </div>
      <span class="stage ${stageClass(stage)}">${esc(stage || "—")}</span>
    `;
    list.appendChild(el);
  });
}

// ===== NEW STARTERS (RIGHT COLUMN, DATE ON RIGHT) =====
async function loadNewStarters() {
  const text = await fetchCsvByGid(NEW_STARTERS_GID);
  const rows = csvToRows(text.trim());
  if (rows.length < 2) return;

  const headers = rows.shift().map(h => String(h).trim());

  const iName  = pickIndex(headers, ["Name","Full_Name","Candidate","New_Starter","Employee"]);
  const iRole  = pickIndex(headers, ["Role","Job_Title","Job","Position"]);
  const iTeam  = pickIndex(headers, ["Team","Department"]);
  const iStart = pickIndex(headers, ["Start_Date","Start Date","Start","Joining_Date","Join_Date"]);

  const list = document.getElementById("newStartersList");
  if (!list) return;
  list.innerHTML = "";

  rows.forEach(r => {
    const name = (r[iName] ?? "").trim();
    if (!name) return;

    const role = (r[iRole] ?? "").trim();
    const team = (r[iTeam] ?? "").trim();
    const start = (r[iStart] ?? "").trim();

    const el = document.createElement("div");
    el.className = "row";
    el.innerHTML = `
      <div style="min-width:0;">
        <div class="title">${esc(name)}</div>
        <div class="meta">
          ${role ? `<span>${esc(role)}</span>` : ``}
          ${team ? `<span>${esc(team)}</span>` : ``}
        </div>
      </div>
      <span class="pill">${esc(start || "—")}</span>
    `;
    list.appendChild(el);
  });
}

// ===== CANDIDATE SOURCES (% CHART) =====
let candidateSourcesChart = null;

function modernPalette(n) {
  // Techy palette: teal/blue/indigo + Pole Star orange accents (no childish rainbow)
  const base = [
    "rgba(247,142,98,.95)",   // Pole Star orange
    "rgba(110,231,183,.85)",  // mint
    "rgba(56,189,248,.85)",   // sky
    "rgba(129,140,248,.85)",  // indigo
    "rgba(34,211,238,.80)",   // cyan
    "rgba(94,234,212,.80)",   // teal
    "rgba(167,139,250,.80)",  // violet
    "rgba(251,191,36,.75)"    // amber (subtle)
  ];
  const out = [];
  for (let i = 0; i < n; i++) out.push(base[i % base.length]);
  return out;
}

function renderCandidateLegend(items, colors) {
  const el = document.getElementById("candidateSourcesLegend");
  if (!el) return;

  el.innerHTML = items.map((it, idx) => `
    <div class="legend-item">
      <div class="legend-left">
        <span class="legend-dot" style="background:${colors[idx]};"></span>
        <span class="legend-name">${esc(it.source)}</span>
      </div>
      <span class="legend-pct">${it.pct}%</span>
    </div>
  `).join("");
}

async function loadCandidateSourcesChart() {
  const empty = document.getElementById("candidateSourcesEmpty");
  const canvas = document.getElementById("candidateSourcesChart");
  if (!canvas) return;

  const text = await fetchCsvByGid(CANDIDATE_SOURCES_GID);
  const rows = csvToRows(text.trim());
  if (rows.length < 2) {
    if (empty) empty.textContent = "No data";
    return;
  }

  const headers = rows.shift().map(h => String(h).trim());

  // Your headers: source, amount
  const iSource = pickIndex(headers, ["source"]);
  const iAmount = pickIndex(headers, ["amount"]);

  if (iSource < 0 || iAmount < 0) {
    if (empty) empty.textContent = "Check headers";
    return;
  }

  const raw = [];
  for (const r of rows) {
    const source = String(r[iSource] ?? "").trim();
    const amount = toNumber(r[iAmount]);
    if (!source || amount <= 0) continue;
    raw.push({ source, amount });
  }

  const total = raw.reduce((s, x) => s + x.amount, 0);
  if (!total) {
    if (empty) empty.textContent = "No data";
    return;
  }

  // Calculate % and sort desc for cleaner legend
  const items = raw
    .map(x => ({ source: x.source, pct: +(x.amount / total * 100).toFixed(1) }))
    .sort((a,b) => b.pct - a.pct);

  const labels = items.map(i => i.source);
  const data = items.map(i => i.pct);
  const colors = modernPalette(items.length);

  if (empty) empty.style.display = "none";

  // Legend underneath
  renderCandidateLegend(items, colors);

  if (candidateSourcesChart) candidateSourcesChart.destroy();

  candidateSourcesChart = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: "rgba(255,255,255,.10)",
        borderWidth: 1,
        spacing: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      layout: { padding: 6 }, // extra breathing room inside canvas
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw}%`
          }
        },
        datalabels: {
          color: "rgba(255,255,255,.92)",
          font: { weight: "800", size: 10 },
          formatter: (value) => (value >= 6 ? `${value}%` : ""), // hide tiny slices
          anchor: "center",
          align: "center",
          clamp: true
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// ===== INIT =====
Promise.all([
  loadStatusKpis(),
  loadLiveRoles(),
  loadNewStarters(),
  loadCandidateSourcesChart()
]).catch(err => {
  console.error(err);
});
