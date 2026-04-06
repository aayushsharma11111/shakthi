function updateRisk() {
  const { userCoords, dangerZones } = appState;
  if (!userCoords) return;

  let count = 0;

  dangerZones.forEach(z => {
    let d = Math.sqrt(
      (userCoords[0] - z.pos[0]) ** 2 +
      (userCoords[1] - z.pos[1]) ** 2
    );
    if (d < 0.02) count++;
  });

  const pill = document.getElementById("riskPill");
  const text = document.getElementById("riskText");

  if (count === 0) {
    pill.className = "risk-pill risk-low";
    text.textContent = "LOW RISK";
  } else if (count === 1) {
    pill.className = "risk-pill risk-medium";
    text.textContent = "MEDIUM RISK";
  } else {
    pill.className = "risk-pill risk-high";
    text.textContent = "HIGH RISK";
  }
}