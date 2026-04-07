function triggerSOS() {
  const { userCoords } = appState;

  if (!userCoords) {
    alert("⚠️ Location not available");
    return;
  }

  // 🔊 SOUND
  try {
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
    audio.loop = true;
    audio.play();

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
    type: "manual",
    location: userCoords,
    time: new Date().toISOString()
  };

  console.log("🚨 SOS SENT:", alertData);

  // 💾 SAVE
  localStorage.setItem("lastSOS", JSON.stringify(alertData));

  // 🔥 SEND TO BACKEND (NEW CODE)
  fetch("http://localhost:5000/sos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      location: userCoords,
      type: "manual",
      timestamp: new Date().toISOString()
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("✅ Backend Response:", data);
  })
  .catch(err => {
    console.error("❌ Backend Error:", err);
  });

  // 📢 USER FEEDBACK
  alert("🚨 SOS sent! Emergency contacts notified");

  // 📞 CALL EMERGENCY NUMBER
  setTimeout(() => {
    window.location.href = "tel:112";
  }, 1000);
}