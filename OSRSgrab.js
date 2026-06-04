async function loadStats() {
  const user = document.getElementById("user").value;
  const columns = document.getElementById("skill-columns");
  columns.innerHTML = "<div>Loading...</div>";

  const url = `/api?user=${encodeURIComponent(user)}`;
  const res = await fetch(url);

  if (!res.ok) {
    columns.innerHTML = "<div>Player not found.</div>";
    return;
  }

  const json = await res.json();
  const d = json.data;

  // OSRS sidebar layout
  const layout = [
    // Column 1
    ["Attack","Strength","Ranged","Magic","Runecraft","Construction","Hitpoints"],
    // Column 2
    ["Defence","Prayer","Cooking","Fletching","Slayer","Hunter","Overall"],
    // Column 3
    ["Mining","Smithing","Fishing","Firemaking","Woodcutting","Agility","Thieving","Crafting","Farming","Herblore","Sailing"]
  ];

  columns.innerHTML = "";

  for (const col of layout) {
    const colDiv = document.createElement("div");

    for (const skill of col) {
      const xp = d[skill];
      const level = d[`${skill}_level`];
      if (xp === undefined || level === undefined) continue;

      const icon = skill === "Overall"
        ? "https://oldschool.runescape.wiki/images/Stats_icon.png"
        : `https://oldschool.runescape.wiki/images/${skill}_icon.png`;

      const card = document.createElement("div");
      card.className = "skill-card";

      card.innerHTML = `
        <img src="${icon}">
        <div class="skill-name">${skill}</div>
        <div class="skill-level">Lvl ${level}</div>
      `;

      colDiv.appendChild(card);
    }

    columns.appendChild(colDiv);
  }
}
