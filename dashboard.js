// ===== GIDs =====
const STATUS_GID = "1256252635";
const LIVE_ROLES_GID = "0";
const NEW_STARTERS_GID = "2080311953";
const CANDIDATE_SOURCES_GID = "1950940614";

const PROGRESS_GID = "322463420";
const CHALLENGES_GID = "868728520";
const KEY_FOCUS_GID = "575160875";

// ✅ NEW GIDs
const PIPELINE_HEALTH_GID = "1289702328"; // pipeline_health
const TIME_TO_OFFER_GID   = "300572217";  // Time_To

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

// ===== LIVE ROLES LIST + FILTERS (Location + Stage only) =====
async function loadLiveRoles() {
  const text = await fetchCsvByGid(LIVE_ROLES_GID);
  const rows = csvToRows(text.trim());
  if (rows.length < 2) throw new Error("Live roles tab has no data");

  const headers = rows.shift().map(h => String(h).trim());
  const idx = (name) => headers.indexOf(name);

  const list = document.getElementById("liveRolesList");
  if (!list) return;

  // Filter elements
  const selLoc = document.getElementById("liveFilterLocation");
  const selStage = document.getElementById("liveFilterStage");

  // Build data model once
  const data = [];
  rows.forEach(r => {
    const title = (r[idx("Job_Title")] ?? "").trim();
    if (!title) return;

    data.push({
      title,
      team: (r[idx("Team")] ?? "").trim(),
      location: (r[idx("Location")] ?? "").trim(),
      applicants: toNumber(r[idx("Applicants")]),
      stage: (r[idx("Current_Stage")] ?? "").trim()
    });
  });

  const uniqSorted = (arr) =>
    Array.from(new Set(arr.map(x => (x || "").trim()).filter(Boolean)))
      .sort((a,b) => a.localeCompare(b));

  // Populate dropdowns
  if (selLoc) {
    const locations = uniqSorted(data.map(d => d.location));
    selLoc.innerHTML = `<option value="">All</option>` + locations
      .map(v => `<option value="${esc(v)}">${esc(v)}</option>`)
      .join("");
  }

  if (selStage) {
    const stages = uniqSorted(data.map(d => d.stage));
    selStage.innerHTML = `<option value="">All</option>` + stages
      .map(v => `<option value="${esc(v)}">${esc(v)}</option>`)
      .join("");
  }

  function render() {
    const chosenLoc = (selLoc?.value || "").trim();
    const chosenStage = (selStage?.value || "").trim();

    const filtered = data.filter(d => {
      if (chosenLoc && d.location !== chosenLoc) return false;
      if (chosenStage && d.stage !== chosenStage) return false;
      return true;
    });

    list.innerHTML = "";

    filtered.forEach(d => {
      const el = document.createElement("div");
      el.className = "row";
      el.innerHTML = `
        <div style="min-width:0;">
          <div class="title">${esc(d.title)}</div>
          <div class="meta">
            ${d.team ? `<span class="team">${esc(d.team)}</span>` : ``}
            ${d.location ? `<span class="pill">${esc(d.location)}</span>` : ``}
            <span>${d.applicants} applicants</span>
          </div>
        </div>
        <span class="stage ${stageClass(d.stage)}">${esc(d.stage || "—")}</span>
      `;
      list.appendChild(el);
    });
  }

  if (selLoc) selLoc.onchange = render;
  if (selStage) selStage.onchange = render;

  render();
}

// ===== NEW STARTERS (TEAM UNDER JOB TITLE) =====
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
        ${role ? `<div class="meta">${esc(role)}</div>` : ``}
        ${team ? `<div class="meta team">${esc(team)}</div>` : ``}
      </div>
      <span class="pill">${esc(start || "—")}</span>
    `;
    list.appendChild(el);
  });
}

// ===== CANDIDATE SOURCES CHART =====
let candidateSourcesChart = null;

function modernPalette(n) {
  const base = [
    "rgba(247,142,98,.95)",
    "rgba(34,211,238,.85)",
    "rgba(56,189,248,.85)",
    "rgba(129,140,248,.85)",
    "rgba(94,234,212,.80)",
    "rgba(167,139,250,.80)",
    "rgba(110,231,183,.80)",
    "rgba(251,191,36,.75)"
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

  const items = raw
    .map(x => ({ source: x.source, pct: +(x.amount / total * 100).toFixed(1) }))
    .sort((a,b) => b.pct - a.pct);

  const labels = items.map(i => i.source);
  const data = items.map(i => i.pct);
  const colors = modernPalette(items.length);

  if (empty) empty.style.display = "none";
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
        spacing: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "46%",
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}%` } }
      }
    }
  });
}

// ===== SIMPLE LIST RENDERERS (Progress / Challenges / Key Focus) =====
function renderSimpleList(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = "";

  const cleaned = items.map(x => String(x || "").trim()).filter(Boolean);

  if (!cleaned.length) {
    el.innerHTML = `<div class="list-item">—</div>`;
    return;
  }

  cleaned.forEach(txt => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.textContent = txt;
    el.appendChild(div);
  });
}

async function loadTextListFromSheet(gid, containerId) {
  const text = await fetchCsvByGid(gid);
  const rows = csvToRows(text.trim());
  if (!rows.length) {
    renderSimpleList(containerId, ["—"]);
    return;
  }

  const body = rows.slice(1); // skip header row
  const items = [];

  for (const r of body) {
    const cell = (r.find(v => String(v).trim() !== "") ?? "").trim();
    if (cell) items.push(cell);
  }

  renderSimpleList(containerId, items);
}

/* ===========================
   PIPELINE HEALTH (single column: pipeline_health)
   =========================== */
async function loadPipelineHealth() {
  const wrap = document.getElementById("pipelineHealthWrap");
  if (!wrap) return;

  const text = await fetchCsvByGid(PIPELINE_HEALTH_GID);
  const rows = csvToRows(text.trim());
  if (rows.length < 2) return;

  const headers = rows.shift().map(h => String(h).trim());

  const iPH = pickIndex(headers, [
    "pipeline_health",
    "pipeline health",
    "Pipeline_Health",
    "Pipeline Health"
  ]);
  if (iPH < 0) return;

  // find first non-empty pipeline_health value anywhere in the rows
  let chosen = "";
  for (const r of rows) {
    const v = String(r[iPH] ?? "").trim();
    if (v) { chosen = v; break; }
  }
  if (!chosen) return;

  const normalise = (v) => String(v || "")
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const norm = normalise(chosen);

  const steps = Array.from(wrap.querySelectorAll(".pipeline-step"));
  steps.forEach(s => s.classList.remove("active"));

  const target = steps.find(s => normalise(s.getAttribute("data-key")) === norm);
  if (target) target.classList.add("active");
}

/* ===========================
   TIME TO OFFER
   =========================== */
function setupDelayedTooltipOnElement(el, tipEl, delayMs) {
  if (!el || !tipEl) return;
  let tmr = null;

  const show = () => tipEl.classList.add("show");
  const hide = () => tipEl.classList.remove("show");

  el.addEventListener("mouseenter", () => { tmr = setTimeout(show, delayMs); });
  el.addEventListener("mouseleave", () => { if (tmr) clearTimeout(tmr); tmr = null; hide(); });

  el.addEventListener("focus", () => { tmr = setTimeout(show, delayMs); });
  el.addEventListener("blur", () => { if (tmr) clearTimeout(tmr); tmr = null; hide(); });
}

/* formats "35" or "35 days" as: 35 <span class="unit">days</span> */
function setDaysMetric(el, rawVal) {
  if (!el) return;
  const raw = String(rawVal ?? "").trim();
  if (!raw) { el.textContent = "—"; return; }

  const m = raw.match(/^(\d+(?:\.\d+)?)\s*(days?|d)?$/i);
  if (m) {
    el.innerHTML = `${esc(m[1])} <span class="unit">days</span>`;
    return;
  }

  el.textContent = raw;
}

async function loadTimeToOffer() {
  const elTarget = document.getElementById("ttoTarget");
  const elCurrent = document.getElementById("ttoCurrent");
  const elExpected = document.getElementById("ttoExpected");
  if (!elTarget || !elCurrent || !elExpected) return;

  setupDelayedTooltipOnElement(
    document.getElementById("ttoCurrentMetric"),
    document.getElementById("ttoCurrentTip"),
    1000
  );
  setupDelayedTooltipOnElement(
    document.getElementById("ttoExpectedMetric"),
    document.getElementById("ttoExpectedTip"),
    1000
  );

  const text = await fetchCsvByGid(TIME_TO_OFFER_GID);
  const rows = csvToRows(text.trim());
  if (rows.length < 2) return;

  const headers = rows.shift().map(h => String(h).trim());
  const dataRow = rows.find(r => r.some(v => String(v).trim() !== "")) || [];

  const normH = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
  const H = headers.map(normH);

  const iTarget = H.indexOf("target");
  const iCurrent = H.indexOf("current");
  const iExpected = H.indexOf("expected");

  const tVal = (iTarget >= 0 ? dataRow[iTarget] : dataRow[0]) ?? "";
  const cVal = (iCurrent >= 0 ? dataRow[iCurrent] : dataRow[1]) ?? "";
  const eVal = (iExpected >= 0 ? dataRow[iExpected] : dataRow[2]) ?? "";

  setDaysMetric(elTarget, tVal);
  setDaysMetric(elCurrent, cVal);
  setDaysMetric(elExpected, eVal);
}

// ===== INIT =====
Promise.all([
  loadStatusKpis(),
  loadLiveRoles(),
  loadNewStarters(),
  loadCandidateSourcesChart(),
  loadTextListFromSheet(PROGRESS_GID, "progressList"),
  loadTextListFromSheet(CHALLENGES_GID, "challengesList"),
  loadTextListFromSheet(KEY_FOCUS_GID, "keyFocusList"),
  loadPipelineHealth(),
  loadTimeToOffer()
]).catch(err => console.error(err));
