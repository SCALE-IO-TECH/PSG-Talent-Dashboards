const LIVE_ROLES_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRI6ijLxl_6gvJVxsLK7ChUyJOcDmpeVg0hkSAYgLSsgTzeuoHQyVrMq77afuJ1YfLwtOUAKwfNGqkJ/pub?output=csv&sheet=live_roles";

function csvToRows(text) {
  // Handles quoted commas
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

function toNumber(x) {
  const n = Number(String(x ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function stageClass(stage) {
  const s = String(stage || "").trim().toLowerCase();
  if (s === "offer") return "offer";
  if (s === "hired") return "hired";
  return "";
}

async function loadLiveRoles() {
  const list = document.getElementById("liveRolesList");
  if (!list) return;

  const res = await fetch(LIVE_ROLES_CSV, { cache: "no-store" });
  const text = await res.text();

  const raw = csvToRows(text.trim());
  if (!raw.length) return;

  const headers = raw.shift().map(h => h.trim());
  const idx = (name) => headers.indexOf(name);

  const roles = raw
    .map(r => ({
      Job_Title: (r[idx("Job_Title")] ?? "").trim(),
      Team: (r[idx("Team")] ?? "").trim(),
      Location: (r[idx("Location")] ?? "").trim(),
      Applicants: (r[idx("Applicants")] ?? "").trim(),
      Current_Stage: (r[idx("Current_Stage")] ?? "").trim(),
    }))
    .filter(r => r.Job_Title);

  // KPIs
  const applicantsTotal = roles.reduce((sum, r) => sum + toNumber(r.Applicants), 0);

  const kpiLiveRoles = document.getElementById("kpiLiveRoles");
  const kpiApplicants = document.getElementById("kpiApplicants");
  const kpiOffers = document.getElementById("kpiOffers");
  const kpiHires = document.getElementById("kpiHires");

  if (kpiLiveRoles) kpiLiveRoles.textContent = String(roles.length);
  if (kpiApplicants) kpiApplicants.textContent = applicantsTotal ? String(applicantsTotal) : "—";

  // Offers & Hires from Current_Stage
  const offers = roles.filter(r => String(r.Current_Stage).trim().toLowerCase() === "offer").length;
  const hires = roles.filter(r => String(r.Current_Stage).trim().toLowerCase() === "hired").length;

  if (kpiOffers) kpiOffers.textContent = String(offers);
  if (kpiHires) kpiHires.textContent = String(hires);

  // Render
  list.innerHTML = "";

  roles.forEach(r => {
    const el = document.createElement("div");
    el.className = "role";
    el.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div class="title">${r.Job_Title}</div>
        <div style="font-size:12px; color:rgba(255,255,255,.65);">
          ${r.Team || "—"} • ${r.Location || "—"} • ${toNumber(r.Applicants)} applicants
        </div>
      </div>
      <span class="stage ${stageClass(r.Current_Stage)}">${r.Current_Stage || "—"}</span>
    `;
    list.appendChild(el);
  });
}

loadLiveRoles().catch(() => {
  // do nothing
});
