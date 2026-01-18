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

/* ===========================
   i18n (ENG / ESP / FRA)
   =========================== */
const I18N = {
  en: {
    hiring_dashboard: "Hiring Dashboard",
    live_roles: "Live Roles",
    on_hold: "On Hold",
    offers: "Offers",
    hires: "Hires",
    candidate_sources: "Candidate Sources",
    new_starters: "New Starters",
    progress: "Progress",
    challenges: "Challenges",
    key_focus: "Key Focus",
    pipeline_health: "Pipeline Health",
    time_to_offer: "Time to Offer",
    target: "Target",
    current: "Current",
    expected: "Expected",
    loading: "Loading…",
    no_data: "No data",
    check_headers: "Check headers",
    applicants: "applicants",
    based_on_last_five_offers: "Based on our last five offers.",
    estimated_next_role: "Estimated time from sign-off to offer extended for the next approved role.",
    management_handbook: "Management Handbook",
    manager_guidelines: "Manager Guidelines",
    powered_by: "Powered by",
    poor: "Poor",
    needs_work: "Needs work",
    ok: "OK",
    good: "Good",
    excellent: "Excellent",
    days: "days",
    offer_stage: "Offer",
    hired_stage: "Hired"
  },
  es: {
    hiring_dashboard: "Panel de Contratación",
    live_roles: "Vacantes Activas",
    on_hold: "En Pausa",
    offers: "Ofertas",
    hires: "Contrataciones",
    candidate_sources: "Fuentes de Candidatos",
    new_starters: "Nuevas Incorporaciones",
    progress: "Progreso",
    challenges: "Desafíos",
    key_focus: "Enfoque Clave",
    pipeline_health: "Salud del Pipeline",
    time_to_offer: "Tiempo hasta Oferta",
    target: "Objetivo",
    current: "Actual",
    expected: "Previsto",
    loading: "Cargando…",
    no_data: "Sin datos",
    check_headers: "Revisa los encabezados",
    applicants: "candidatos",
    based_on_last_five_offers: "Basado en nuestras últimas cinco ofertas.",
    estimated_next_role: "Tiempo estimado desde aprobación hasta oferta para el próximo puesto aprobado.",
    management_handbook: "Manual de Gestión",
    manager_guidelines: "Guía para Managers",
    powered_by: "Con tecnología de",
    poor: "Malo",
    needs_work: "Mejorable",
    ok: "Aceptable",
    good: "Bueno",
    excellent: "Excelente",
    days: "días",
    offer_stage: "Oferta",
    hired_stage: "Contratado"
  },
  fr: {
    hiring_dashboard: "Tableau de Recrutement",
    live_roles: "Postes Ouverts",
    on_hold: "En Pause",
    offers: "Offres",
    hires: "Embauches",
    candidate_sources: "Sources de Candidats",
    new_starters: "Nouvelles Arrivées",
    progress: "Progrès",
    challenges: "Défis",
    key_focus: "Priorité Clé",
    pipeline_health: "Santé du Pipeline",
    time_to_offer: "Délai jusqu’à l’Offre",
    target: "Cible",
    current: "Actuel",
    expected: "Prévu",
    loading: "Chargement…",
    no_data: "Aucune donnée",
    check_headers: "Vérifie les en-têtes",
    applicants: "candidats",
    based_on_last_five_offers: "Basé sur nos cinq dernières offres.",
    estimated_next_role: "Délai estimé entre validation et offre pour le prochain poste approuvé.",
    management_handbook: "Manuel de Management",
    manager_guidelines: "Directives Managers",
    powered_by: "Propulsé par",
    poor: "Faible",
    needs_work: "À améliorer",
    ok: "Correct",
    good: "Bon",
    excellent: "Excellent",
    days: "jours",
    offer_stage: "Offre",
    hired_stage: "Embauché"
  }
};

const LANG_META = {
  en: { code: "ENG", flag: "🇬🇧", htmlLang: "en" },
  es: { code: "ESP", flag: "🇪🇸", htmlLang: "es" },
  fr: { code: "FRA", flag: "🇫🇷", htmlLang: "fr" }
};

let currentLang = "en";

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
}

function applyI18n() {
  if (document && document.documentElement) {
    document.documentElement.lang = LANG_META[currentLang]?.htmlLang || "en";
  }

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    el.textContent = t(key);
  });

  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === currentLang);
    btn.setAttribute("aria-pressed", btn.getAttribute("data-lang") === currentLang ? "true" : "false");
  });

  const empty = document.getElementById("candidateSourcesEmpty");
  if (empty && empty.style.display !== "none") {
    const raw = (empty.textContent || "").trim();
    const known = [
      "Loading…","No data","Check headers",
      "Cargando…","Sin datos","Revisa los encabezados",
      "Chargement…","Aucune donnée","Vérifie les en-têtes"
    ];
    if (!raw || known.includes(raw)) empty.textContent = t("loading");
  }
}

function setLanguage(lang) {
  if (!I18N[lang]) return;
  currentLang = lang;
  try { localStorage.setItem("ps_lang", lang); } catch(e) {}
  applyI18n();

  // Refresh any text that is generated from data
  loadLiveRoles().catch(()=>{});
  loadCandidateSourcesChart().catch(()=>{});
  loadTimeToOffer().catch(()=>{});

  // ✅ NEW: refresh sheet-driven text lists in the chosen language (if language columns exist)
  loadTextListFromSheet(PROGRESS_GID, "progressList").catch(()=>{});
  loadTextListFromSheet(CHALLENGES_GID, "challengesList").catch(()=>{});
  loadTextListFromSheet(KEY_FOCUS_GID, "keyFocusList").catch(()=>{});
}

function initLanguageSwitcher() {
  try {
    const saved = localStorage.getItem("ps_lang");
    if (saved && I18N[saved]) currentLang = saved;
  } catch(e) {}

  document.querySelectorAll("[data-lang]").forEach((btn) => {
    const lang = btn.getAttribute("data-lang");
    const meta = LANG_META[lang];
    if (!meta) return;
    btn.textContent = `${meta.flag} ${meta.code}`;
    btn.addEventListener("click", () => setLanguage(lang));
  });

  applyI18n();
}

/* ===========================
   CSV PARSER
   =========================== */
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

/* ===========================
   Stage translation (sheet-driven)
   - Keeps CSS class logic working
   - Translates Offer/Hired in UI language
   =========================== */
function canonicalStage(stage) {
  const s = String(stage || "").trim().toLowerCase();

  // canonical english
  if (s === "offer" || s === "offre" || s === "oferta") return "offer";
  if (s === "hired" || s === "embauché" || s === "embauche" || s === "contratado") return "hired";

  return s;
}

function stageClass(stage) {
  const c = canonicalStage(stage);
  if (c === "offer") return "offer";
  if (c === "hired") return "hired";
  return "";
}

function displayStage(stageRaw) {
  const c = canonicalStage(stageRaw);
  if (c === "offer") return t("offer_stage");
  if (c === "hired") return t("hired_stage");
  return String(stageRaw || "").trim();
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
    const stageRaw = (r[idx("Current_Stage")] ?? "").trim();

    const el = document.createElement("div");
    el.className = "row";
    el.innerHTML = `
      <div style="min-width:0;">
        <div class="title">${esc(title)}</div>
        <div class="meta">
          ${team ? `<span class="team">${esc(team)}</span>` : ``}
          ${location ? `<span class="pill">${esc(location)}</span>` : ``}
          <span>${applicants} ${esc(t("applicants"))}</span>
        </div>
      </div>
      <span class="stage ${stageClass(stageRaw)}">${esc(displayStage(stageRaw) || "—")}</span>
    `;
    list.appendChild(el);
  });
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

  if (empty) empty.textContent = t("loading");

  const text = await fetchCsvByGid(CANDIDATE_SOURCES_GID);
  const rows = csvToRows(text.trim());
  if (rows.length < 2) {
    if (empty) empty.textContent = t("no_data");
    return;
  }

  const headers = rows.shift().map(h => String(h).trim());
  const iSource = pickIndex(headers, ["source"]);
  const iAmount = pickIndex(headers, ["amount"]);

  if (iSource < 0 || iAmount < 0) {
    if (empty) empty.textContent = t("check_headers");
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
    if (empty) empty.textContent = t("no_data");
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

/* ✅ NEW: Try to pick a language column if it exists (en/es/fr),
   otherwise keep original behavior (first non-empty cell). */
function pickLangColumnIndex(headers) {
  const norm = (s) =>
    String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[_\-]+/g, "");

  const H = headers.map(norm);

  const candidates = {
    en: ["en","eng","english","anglais","ingles"],
    es: ["es","esp","spanish","espanol","español","castellano"],
    fr: ["fr","fra","french","francais","français"]
  };

  const list = candidates[currentLang] || candidates.en;
  for (const c of list) {
    const i = H.indexOf(norm(c));
    if (i >= 0) return i;
  }
  return -1;
}

async function loadTextListFromSheet(gid, containerId) {
  const text = await fetchCsvByGid(gid);
  const rows = csvToRows(text.trim());
  if (!rows.length) {
    renderSimpleList(containerId, ["—"]);
    return;
  }

  const headers = rows[0].map(h => String(h).trim());
  const body = rows.slice(1);

  const langCol = pickLangColumnIndex(headers);
  const items = [];

  for (const r of body) {
    let cell = "";

    // Use language column if present
    if (langCol >= 0) {
      cell = String(r[langCol] ?? "").trim();
    }

    // Fallback to original behavior (first non-empty cell in row)
    if (!cell) {
      cell = (r.find(v => String(v).trim() !== "") ?? "").trim();
    }

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

function setDaysMetric(el, rawVal) {
  if (!el) return;
  const raw = String(rawVal ?? "").trim();
  if (!raw) { el.textContent = "—"; return; }

  const m = raw.match(/^(\d+(?:\.\d+)?)\s*(days?|d)?$/i);
  if (m) {
    el.innerHTML = `${esc(m[1])} <span class="unit">${esc(t("days"))}</span>`;
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
window.addEventListener("DOMContentLoaded", () => {
  initLanguageSwitcher();

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
});
