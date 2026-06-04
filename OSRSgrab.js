async function loadStats() {
  const user = document.getElementById("user").value;
  const grid = document.getElementById("skill-grid");
  grid.innerHTML = "<div>Loading...</div>";

  const url = `/api?user=${encodeURIComponent(user)}`;
  const res = await fetch(url);

  if (!res.ok) {
    grid.innerHTML = "<div>Player not found.</div>";
    return;
  }

  const json = await res.json();
  const d = json.data;

  const skills = [
    "Overall","Attack","Defence","Strength","Hitpoints","Ranged","Prayer",
    "Magic","Cooking","Woodcutting","Fletching","Fishing","Firemaking",
    "Crafting","Smithing","Mining","Herblore","Agility","Thieving",
    "Slayer","Farming","Runecraft","Hunter","Construction","Sailing"
  ];

  grid.innerHTML = "";

  for (const skill of skills) {
    const xp = d[skill];
    const level = d[`${skill}_level`];

    if (xp === undefined || level === undefined) continue;

    // ⭐ OSRS Wiki icon logic
    const icon = skill === "Overall"
      ? "https://oldschool.runescape.wiki/images/Stats_icon.png"
      : `https://oldschool.runescape.wiki/images/${skill}_icon.png`;

    const card = document.createElement("div");
    card.className = "skill-card";

    card.innerHTML = `
      <img src="${icon}">
      <div class="skill-name">${skill}</div>
      <div class="skill-level">Lvl ${level}</div>
      <div class="skill-level">${xp.toLocaleString()} XP</div>
    `;

    grid.appendChild(card);
  }
}

