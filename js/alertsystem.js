console.log("✅ alertsystem.js loaded");

// Check browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    console.log("❌ Speech Recognition NOT supported in this browser");
    alert("Speech Recognition not supported. Use Google Chrome.");
} else {

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    let isListening = false;

    // 👉 Start mic on ANY click
    document.body.addEventListener("click", () => {
        console.log("🖱️ Click detected");

        if (!isListening) {
            try {
                recognition.start();
                isListening = true;
                console.log("🎤 Voice system ACTIVATED");
            } catch (e) {
                console.error("Start error:", e);
            }
        }
    }, { once: true });

    recognition.onstart = () => {
        console.log("🎤 Listening for keywords...");
    };

    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript
            .trim()
            .toLowerCase();

        console.log("🗣️ Heard:", transcript);

        // 🔥 KEYWORD DETECTION
        if (transcript.includes("help") || transcript.includes("emergency")) {
            console.log("🚨 KEYWORD DETECTED!");

            // Try getting location
            if (typeof userMarker !== "undefined" && userMarker) {
                const pos = userMarker.getLatLng();
                triggerVoiceSOS(pos.lat, pos.lng);
            } else {
                console.log("⚠️ No map yet, triggering without location");
                triggerVoiceSOS(null, null);
            }
        }
    };

    recognition.onerror = (event) => {
        console.error("❌ Speech error:", event.error);

        if (event.error === "not-allowed") {
            alert("Please allow microphone access!");
        }
    };

    recognition.onend = () => {
        console.log("🔄 Restarting voice listener...");

        if (isListening) {
            try {
                recognition.start();
            } catch (e) {
                console.error("Restart error:", e);
            }
        }
    };
}


// 🚨 SOS FUNCTION
function triggerVoiceSOS(lat, lng) {

    console.log("🚨 VOICE SOS TRIGGERED");

    if (lat && lng) {
        console.log(`📍 Location: ${lat}, ${lng}`);
    }

    // Popup alert
    alert("🚨 VOICE SOS ACTIVATED!");

    // Update marker if exists
    if (typeof userMarker !== "undefined" && userMarker) {
        userMarker.bindPopup("🚨 VOICE SOS ACTIVE!").openPopup();
    }
}