// CHANGE NOTHING ABOVE THIS LINE

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRI6ijLxl_6gvJVxsLK7ChUyJOcDmpeVg0hkSAYgLSsgTzeuoHQyVrMq77afuJ1YfLwtOUAKwfNGqkJ/pub?output=csv&sheet=live_roles";

const rolesContainer = document.querySelector(".card h2")
  .parentElement;

// remove placeholder roles
rolesContainer.querySelectorAll(".role").forEach(r => r.remove());

fetch(SHEET_URL)
  .then(res => res.text())
  .then(csv => {
    const rows = csv.trim().split("\n").map(r => r.split(","));
    const headers = rows.shift();

    const idx = name => headers.indexOf(name);

    rows.forEach(row => {
      const stage = row[idx("Current_Stage")];

      const role = document.createElement("div");
      role.className = "role";

      role.innerHTML = `
        <div class="title">${row[idx("Job_Title")]}</div>
        <span class="stage ${stage === "Offer" ? "offer" : stage === "Hired" ? "hired" : ""}">
          ${stage}
        </span>
      `;

      rolesContainer.appendChild(role);
    });
  });

