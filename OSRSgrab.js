
async function loadStats() {
  const user = document.getElementById("user").value;
  const output = document.getElementById("output");
  output.innerHTML = "Loading...";

  const url = `/api?user=${encodeURIComponent(user)}`;

  let res;

  try {
    res = await fetch(url);
  } catch (e) {
    output.innerHTML = "Network error — proxy unreachable.";
    return;
  }

  if (!res.ok) {
    output.innerHTML = "Player not found or API error.";
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

  let html = "";

  for (const skill of skills) {
    const xp = d[skill];
    const level = d[`${skill}_level`];

    if (xp !== undefined && level !== undefined) {
      html += `<div class="skill"><strong>${skill}</strong>: Level ${level} (XP: ${xp})</div>`;
    }
  }

  output.innerHTML = html || "No skill data found.";
}

