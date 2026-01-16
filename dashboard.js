// dashboard.js (REPLACE ENTIRE FILE)

const BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRI6ijLxl_6gvJVxsLK7ChUyJOcDmpeVg0hkSAYgLSsgTzeuoHQyVrMq77afuJ1YfLwtOUAKwfNGqkJ/pub?output=csv&sheet=";

const STATUS_SHEET_CANDIDATES = ["status", "Status", "STATUS"]; // your 2nd tab name
const LIVE_ROLES_SHEET = "live_roles";

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
      row = [];
      continue;
    }

    cur += ch;
  }

  row.push(cur);
  if (row.some(v => String(v).trim() !== "")) rows.push(row);
  return rows;
}

function normHeader(h) {
  // trim + remove BOM + collapse spaces + keep underscores
  return String(h || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/\s+/g, "_")
    .toLowerCase();
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
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

async function fetchSheet(sheetName) {
  // cache-bust so you always see latest
  const url = BASE + encodeURIComponent(sheetName) + "&t=" + Date.now();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}) for sheet: ${sheetName}`);
  const text = await res.text();
  const rows = csvToRows(text.trim());
  if (!rows.length) throw new Error(`No data returned for sheet: ${sheetName}`);
  return rows;
}

/* ---------- STATUS KPI BAR (MUST COME FROM status TAB) ---------- */

function setKpi(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

async function loadStatusKpis() {
  // Try candidate sheet names until one works
  let rows = null;
  let usedSheet = null;

  for (const name of STATUS_SHEET_CANDIDATES) {
    try {
      rows = await fetchSheet(name);
      usedSheet = name;
      break;
    } catch (e) {
      // try next
    }
  }

  if (!rows) {
    // hard fail visible
    setKpi("kpiLiveRoles", "ERR");
    setKpi("kpiOnHold", "ERR");
    setKpi("kpiOffers", "ERR");
    setKpi("kpiHires", "ERR");
    throw new Error("Could not load status tab (tried: " + STATUS_SHEET_CANDIDATES.join(", ") + ")");
  }

  const headersRaw = rows.shift();
  const headers = headersRaw.map(normHeader);

  // Find first non-empty data row
  const dataRow = rows.find(r => r.some(v => String(v).trim() !== "")) || [];

  const get = (headerName) => {
    const idx = headers.indexOf(normHeader(headerName));
    return idx >= 0 ? toNumber(dataRow[idx]) : 0;
  };

  // These are your exact headers (robust to spaces/case):
  const liveRoles = get("Live_Roles");
  const onHold = get("On_Hold");
  const offers = get("Offers");
  const hires = get("Hires");

  setKpi("kpiLiveRoles", String(liveRoles));
  setKpi("kpiOnHold", String(onHold));
  setKpi("kpiOffers", String(offers));
  setKpi("kpiHires", String(hires));

  // If you ever need to verify it’s reading the right sheet:
  // console.log("Loaded KPIs from sheet:", usedSheet);
}

/* ---------- LIVE ROLES LIST ---------- */

async function loadLiveRoles() {
  const rows = await fetchSheet(LIVE_ROLES_SHEET);
  const headersRaw = rows.shift();
  const headers = headersRaw.map(h => String(h).replace(/^\uFEFF/, "").trim());
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
    el.className = "role";
    el.innerHTML = `
      <div style="min-width:0;">
        <div class="title">${esc(title)}</div>
        <div class="roleMeta">
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

Promise.all([loadStatusKpis(), loadLiveRoles()]).catch((e) => {
  // Visible failure already sets ERR for KPIs; keep console for debug.
  console.error(e);
});
