// dashboard.js (REPLACE ENTIRE FILE)
const BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRI6ijLxl_6gvJVxsLK7ChUyJOcDmpeVg0hkSAYgLSsgTzeuoHQyVrMq77afuJ1YfLwtOUAKwfNGqkJ/pub?output=csv&sheet=";

const STATUS_SHEET = "status";       // MUST match your 2nd tab name exactly
const LIVE_ROLES_SHEET = "live_roles";

function csvToRows(text) {
  // Handles quoted commas properly
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
  const res = await fetch(BASE + encodeURIComponent(sheetName), { cache: "no-store" });
  if (!res.ok) throw new Error("Fetch failed: " + sheetName);
  const text = await res.text();
  return csvToRows(text.trim());
}

async function loadStatusKpis() {
  const rows = await fetchSheet(STATUS_SHEET);
  if (rows.length < 2) return;

  const headers = rows.shift().map(h => String(h).trim());
  const idx = (name) => headers.indexOf(name);

  // Find the first non-empty data row (so blanks above don't break it)
  const dataRow = rows.find(r => r.some(v => String(v).trim() !== "")) || [];

  const get = (name) => {
    const i = idx(name);
    return i >= 0 ? toNumber(dataRow[i]) : 0;
  };

  // These must match your status headers exactly:
  const liveRoles = get("Live_Roles");
  const onHold = get("On_Hold");
  const offers = get("Offers");
  const hires = get("Hires");

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  };

  set("kpiLiveRoles", liveRoles);
  set("kpiOnHold", onHold);
  set("kpiOffers", offers);
  set("kpiHires", hires);
}

async function loadLiveRoles() {
  const rows = await fetchSheet(LIVE_ROLES_SHEET);
  if (rows.length < 2) return;

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

Promise.all([loadStatusKpis(), loadLiveRoles()]).catch(() => {});
