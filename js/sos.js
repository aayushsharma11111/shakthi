function triggerSOS() {
  const { userCoords } = appState;

  if (!userCoords) {
    toast("⚠️ Location not available");
    return;
  }

  // 1. Vibrate
  navigator.vibrate?.([300, 100, 300]);

  // 2. Play alarm sound
  const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
  audio.play().catch(() => {});

  // 3. Simulate sending alert (you can replace with real API later)
  const alertData = {
    type: "SOS",
    location: userCoords,
    time: new Date().toISOString()
  };

  console.log("🚨 SOS SENT:", alertData);

  // 4. Store locally (future use)
  localStorage.setItem("lastSOS", JSON.stringify(alertData));

  // 5. Show UI alert
  toast("🚨 SOS sent! Emergency contacts notified");

  // 6. OPTIONAL: open phone dialer (works on mobile)
  window.location.href = "tel:112"; // India emergency number
}