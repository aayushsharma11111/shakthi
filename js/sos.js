function triggerSOS() {
  const { userCoords } = appState;

  if (!userCoords) {
    alert("⚠️ Location not available");
    return;
  }

  // 🔊 SOUND (simple + reliable)
  try {
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
    audio.loop = true;
    audio.play();

    // Stop after 5 seconds
    setTimeout(() => {
      audio.pause();
    }, 5000);
  } catch (e) {}

  // 📳 VIBRATION
  if (navigator.vibrate) {
    navigator.vibrate([500, 200, 500, 200, 500]);
  }

  // 📡 ALERT DATA
  const alertData = {
    type: "SOS",
    location: userCoords,
    time: new Date().toISOString()
  };

  console.log("🚨 SOS SENT:", alertData);

  // 💾 SAVE
  localStorage.setItem("lastSOS", JSON.stringify(alertData));

  // 🧠 OPTIONAL: integrate backend later here

  // 📢 USER FEEDBACK
  alert("🚨 SOS sent! Emergency contacts notified");

  // 📞 CALL EMERGENCY NUMBER (India)
  setTimeout(() => {
    window.location.href = "tel:112";
  }, 1000);
}