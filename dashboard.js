const BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRI6ijLxl_6gvJVxsLK7ChUyJOcDmpeVg0hkSAYgLSsgTzeuoHQyVrMq77afuJ1YfLwtOUAKwfNGqkJ/pub?output=csv&sheet=";

const STATUS_SHEET = "status";
const LIVE_ROLES_SHEET = "live_roles";

function csvToRows(text){
  const rows=[], row=[];
  let cur="", inQuotes=false;

  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c==='"' && inQuotes && n==='"'){cur+='"';i++;continue;}
    if(c==='"'){inQuotes=!inQuotes;continue;}
    if(c==="," && !inQuotes){row.push(cur);cur="";continue;}
    if((c==="\n"||c==="\r")&&!inQuotes){
      if(c==="\r"&&n==="\n")i++;
      row.push(cur);cur="";
      rows.push([...row]);row.length=0;continue;
    }
    cur+=c;
  }
  row.push(cur); rows.push([...row]);
  return rows.filter(r=>r.some(v=>String(v).trim()));
}

function toNumber(v){
  const n=Number(String(v).replace(/[^\d.-]/g,""));
  return Number.isFinite(n)?n:0;
}

function stageClass(stage){
  stage=String(stage||"").trim().toLowerCase();
  if(stage==="offer") return "offer";
  if(stage==="hired") return "hired";
  return "";
}

async function fetchSheet(name){
  const res=await fetch(BASE+name,{cache:"no-store"});
  return csvToRows(await res.text());
}

async function loadStatus(){
  const rows=await fetchSheet(STATUS_SHEET);
  const headers=rows.shift();
  const row=rows[0]||[];
  const i=n=>headers.indexOf(n);

  document.getElementById("kpiLiveRoles").textContent=toNumber(row[i("Live_Roles")]);
  document.getElementById("kpiOnHold").textContent=toNumber(row[i("On_Hold")]);
  document.getElementById("kpiOffers").textContent=toNumber(row[i("Offers")]);
  document.getElementById("kpiHires").textContent=toNumber(row[i("Hires")]);
}

function esc(s){
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

async function loadLiveRoles(){
  const rows=await fetchSheet(LIVE_ROLES_SHEET);
  const headers=rows.shift();
  const i=n=>headers.indexOf(n);
  const list=document.getElementById("liveRolesList");
  list.innerHTML="";

  rows.forEach(r=>{
    const title=(r[i("Job_Title")]||"").trim();
    if(!title) return;

    const team=(r[i("Team")]||"").trim();
    const location=(r[i("Location")]||"").trim();
    const applicants=toNumber(r[i("Applicants")]);
    const stage=(r[i("Current_Stage")]||"").trim();

    const el=document.createElement("div");
    el.className="role";
    el.innerHTML=`
      <div style="min-width:0;">
        <div class="title">${esc(title)}</div>
        <div class="roleMeta">
          ${team ? `<span>${esc(team)}</span>` : ``}
          ${location ? `<span class="pill location">${esc(location)}</span>` : ``}
          <span>${applicants} applicants</span>
        </div>
      </div>
      <span class="stage ${stageClass(stage)}">${esc(stage || "—")}</span>
    `;
    list.appendChild(el);
  });
}

Promise.all([loadStatus(), loadLiveRoles()]).catch(() => {});
