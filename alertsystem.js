// Voice SOS System using Web Speech API

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    console.log("Speech Recognition not supported in this browser");
} else {

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
        console.log("🎤 Voice recognition started...");
    };

    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();

        console.log("Heard:", transcript);

        // 🔥 KEYWORD DETECTION
        if (transcript.includes("help") || transcript.includes("emergency")) {
            console.log("🚨 Keyword detected!");

            // ✅ CHECK IF userMarker EXISTS
            if (typeof userMarker !== "undefined" && userMarker) {
                const position = userMarker.getLatLng();

                triggerVoiceSOS(position.lat, position.lng);
            } else {
                console.warn("⚠️ userMarker not available yet");
                alert("Location not ready. Please wait...");
            }
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
        // Restart automatically (continuous listening)
        recognition.start();
    };

    // Start listening
    recognition.start();
}


// 🚨 SOS FUNCTION
function triggerVoiceSOS(lat, lng) {
    console.log(`🚨 VOICE SOS TRIGGERED at Lat: ${lat}, Lng: ${lng}`);

    // Show alert
    alert("🚨 VOICE SOS ACTIVATED!\nLocation captured.");

    // Update marker popup
    if (typeof userMarker !== "undefined" && userMarker) {
        userMarker.bindPopup("🚨 VOICE SOS ACTIVE!").openPopup();
    }
}