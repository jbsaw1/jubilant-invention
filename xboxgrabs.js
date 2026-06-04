async function loadXboxProfile() {
  const res = await fetch("/xbox-profile");
  const data = await res.json();

  const user = data.profileUsers[0];
  const settings = Object.fromEntries(
    user.settings.map(s => [s.id, s.value])
  );

  document.getElementById("xbox-gamerpic").src = settings.GameDisplayPicRaw;
  document.getElementById("xbox-gamertag").textContent = settings.Gamertag;
  document.getElementById("xbox-gamerscore").textContent = "Gamerscore: " + settings.Gamerscore;
  document.getElementById("xbox-tenure").textContent = "Tenure: " + settings.TenureLevel + " years";
}

async function loadXboxAchievements() {
  const container = document.getElementById("xbox-achievements");
  container.innerHTML = "";

  try {
    const res = await fetch("/xbox-achievements");
    const data = await res.json();

    // If achievements are not available, exit gracefully
    if (!data.achievements || !Array.isArray(data.achievements)) {
      console.warn("Achievements unavailable:", data);
      return; // stop here, no UI crash
    }

    data.achievements
      .filter(a => a.progressState === "Achieved")
      .sort((a, b) => new Date(b.progression.timeUnlocked) - new Date(a.progression.timeUnlocked))
      .slice(0, 12)
      .forEach(a => {
        const art = a.mediaAssets?.find(m => m.type === "Art")?.url;

        const card = document.createElement("div");
        card.className = "achievement-card";

        card.innerHTML = `
          ${art ? `<img src="${art}">` : ""}
          <h4>${a.name}</h4>
          <p>${a.description}</p>
          <p><small>${new Date(a.progression.timeUnlocked).toLocaleString()}</small></p>
        `;

        container.appendChild(card);
      });

  } catch (err) {
    console.error("Failed to load achievements:", err);
  }
}

// Auto-load on page load
window.addEventListener("DOMContentLoaded", () => {
  loadXboxProfile();
  loadXboxAchievements();
});
