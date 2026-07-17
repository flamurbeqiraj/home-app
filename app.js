const grid = document.querySelector("#app-grid");

const cardColors = ["#ffe0e9", "#dff7e8", "#fff0bd", "#dfeaff", "#eee0ff", "#dff7f7"];

async function loadApps() {
  try {
    const response = await fetch("apps/apps.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Lojërat nuk u ngarkuan (${response.status})`);

    const apps = await response.json();
    if (!Array.isArray(apps)) throw new Error("apps.json duhet të përmbajë një listë");

    grid.replaceChildren(...apps.map(createAppCard));
  } catch (error) {
    console.error(error);
    const message = document.createElement("p");
    message.className = "error";
    message.textContent = "Lojërat nuk u ngarkuan. Ju lutemi, hapeni këtë dosje me një server lokal.";
    grid.replaceChildren(message);
  }
}

function createAppCard(app, index) {
  const card = document.createElement("a");
  card.className = "app-card";
  card.href = app.url;
  card.style.setProperty("--card-color", app.color || cardColors[index % cardColors.length]);
  card.setAttribute("aria-label", `Hap ${app.label}`);

  const icon = document.createElement("img");
  icon.className = "app-icon";
  icon.src = app.icon;
  icon.alt = "";
  icon.draggable = false;

  const title = document.createElement("span");
  title.className = "app-title";
  title.textContent = app.label;

  const details = document.createElement("span");
  details.className = "app-details";
  details.append(title);

  if (app.version) {
    const version = document.createElement("span");
    version.className = "app-version";
    version.textContent = app.version;
    details.append(version);
  }

  card.append(icon, details);
  return card;
}

loadApps();
