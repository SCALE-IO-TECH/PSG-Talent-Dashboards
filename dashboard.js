const SHEET_BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRI6ijLxl_6gvJVxsLK7ChUyJOcDmpeVg0hkSAYgLSsgTzeuoHQyVrMq77afuJ1YfLwtOUAKwfNGqkJ/pub?output=csv&sheet=";

function csvToRows(csvText) {
  // Handles quoted commas
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];

    if (ch === '"' && inQuotes && next === '"') { cur += '"'; i++; continue; }
    if (ch === '"') { inQuotes = !inQuotes; continue; }

    if (ch === "," && !inQuotes) { row.push(cur); cur = ""; continue; }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cur); cur = "";
      if (row.some(c => String(c).trim() !== "")) rows.push(row);
      row = [];
      continue;
    }

    cur += ch;
  }

  row.push(cur);
  if (row.some(c => String(c).trim() !== "")) rows.push(row);
  return rows;
}

async function fetchSheet(sheetName) {
  const res = await fetch(SHEET_BASE + encodeURIComponent(sheetName));
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${sheetName}`);
  const text = await res.text();

  const raw = csvToRows(text.trim());
  const headers = raw.shift().map(h => h.trim());

  return raw.map(r => {
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = (r[idx] ?? "").trim()));
    return obj;
  });
}

function toNumber(x) {
  const n = Number(String(x ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function setKpi(labelText, valueText) {
  const kpis = document.querySelectorAll(".kpi");
  for (const kpi of kpis) {
    const label = kpi.querySelector(".label")?.textContent?.trim().toLowerCase();
    if (label === labelText.toLowerCase()) {
      const v = kpi.querySelector(".value");
      if (v) v.textContent = valueText;
      return;
    }
  }
}

function stageClass(stage) {
  const s = String(stage || "").trim().toLowerCase();
  if (s === "offer") return "offer";
  if (s === "hired") return "hired";
  return "";
}

function getLiveRolesCard() {
  const cards = document.querySelectorAll(".card");
  for (const c of cards) {
    const h2 = c.querySelector("h2");
    if (h2 && h2.textContent.trim().toLowerCase() === "live roles") return c;
  }
  return null;
}

function renderLiveRoles(roles) {
  const card = getLiveRolesCard();
  if (!card) return;

  // Remove any existing role rows (placeholders or old render)
  card.querySelectorAll(".role").forEach(r => r.remove());

  roles.forEach(r => {
    const title = r["Job_Title"] || "—";
    const team = r["Team"] || "—";
    const location = r["Location"] || "—";
    const applicantsRaw = r["Applicants"] || "0";
    const applicantsNum = toNumber(applicantsRaw);
    const stage = r["Current_Stage"] || "—";

    const el = document.createElement("div");
    el.className = "role";
    el.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div class="title">${title}</div>
        <div style="font-size:12px; color:rgba(255,255,255,.65); letter-spacing:.02em;">
          ${team} • ${location} • ${applicantsNum} applicants
        </div>
      </div>
      <span class="stage ${stageClass(stage)}">${stage}</span>
    `;
    card.appendChild(el);
  });
}

(async function init() {
  const liveRoles = await fetchSheet("live_roles");
  const roles = liveRoles.filter(r => (r["Job_Title"] || "").trim() !== "");

  const applicantsTotal = roles.reduce((sum, r) => sum + toNumber(r["Applicants"]), 0);

  setKpi("Live Roles", String(roles.length));
  setKpi("Applicants", applicantsTotal ? String(applicantsTotal) : "—");

  renderLiveRoles(roles);
})();
