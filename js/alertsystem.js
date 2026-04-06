console.log("✅ alertsystem.js loaded");

// Check browser support for SpeechRecognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    console.log("❌ Speech Recognition NOT supported in this browser");
    alert("Speech Recognition not supported. Use Google Chrome or a supported browser.");
} else {
    const recognition = new SpeechRecognition();

    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    let isListening = false;
    let lastSosTriggerTime = 0; // Tracks the last time SOS was triggered
    const COOLDOWN_PERIOD_MS = 5000; // 5-second cooldown

    // 👉 Start mic on ANY click to satisfy browser autoplay/audio context policies
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

        // 🔥 KEYWORD DETECTION (Keep limited to "help" and "emergency")
        if (transcript.includes("help") || transcript.includes("emergency")) {
            console.log("🚨 KEYWORD DETECTED!");

            const now = Date.now();
            // Implement Cooldown mechanism to prevent multiple triggers
            if (now - lastSosTriggerTime < COOLDOWN_PERIOD_MS) {
                console.log("⏳ SOS on cooldown. Ignoring extra keywords.");
                return;
            }

            // Update last trigger time
            lastSosTriggerTime = now;

            // Safely check for user marker without crashing
            let lat = null;
            let lng = null;

            if (typeof userMarker !== "undefined" && userMarker !== null && typeof userMarker.getLatLng === "function") {
                const pos = userMarker.getLatLng();
                lat = pos.lat;
                lng = pos.lng;
            } else {
                console.log("⚠️ No active map marker yet, triggering SOS without location");
            }

            triggerVoiceSOS(lat, lng);
        }
    };

    recognition.onerror = (event) => {
        console.error("❌ Speech error:", event.error);

        // Handle specific permission issues gracefully
        if (event.error === "not-allowed" || event.error === "audio-capture") {
            console.warn("⚠️ Microphone access denied. Cannot use voice alerts.");
            alert("Please allow microphone access to enable voice-based SOS alerts!");
            isListening = false; // Stop trying to restart if permission is denied
        }
    };

    recognition.onend = () => {
        console.log("🔄 Voice listener ended. Attempting to restart...");

        // Prevent infinite restart loops with a safe delay (1 second)
        if (isListening) {
            setTimeout(() => {
                try {
                    console.log("🔄 Restarting recognition...");
                    recognition.start();
                } catch (e) {
                    console.error("Restart error (already started or blocked):", e);
                }
            }, 1000); // 1-second delay
        }
    };
}

// 🚨 SOS FUNCTION
function triggerVoiceSOS(lat, lng) {
    console.log("🚨 VOICE SOS TRIGGERED");

    if (lat !== null && lng !== null) {
        console.log(`📍 Location: ${lat}, ${lng}`);
    }

    // Call dedicated UI update function
    displaySOSAlert();

    // Safely update marker if it exists and has bindPopup method
    if (typeof userMarker !== "undefined" && userMarker !== null && typeof userMarker.bindPopup === "function") {
        try {
            userMarker.bindPopup("🚨 VOICE SOS ACTIVE!").openPopup();
        } catch (e) {
            console.error("Failed to update marker popup:", e);
        }
    }
}

/**
 * Handles the UI aspects of the SOS Alert.
 * Currently uses alert() as a fallback.
 * TODO: Replace with a better UI presentation (e.g., custom modal, toast notification, or flashing banner).
 */
function displaySOSAlert() {
    alert("🚨 VOICE SOS ACTIVATED!");
}