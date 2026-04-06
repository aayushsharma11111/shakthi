// Voice SOS System (Auto-start on any click)

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    console.log("❌ Speech Recognition not supported");
} else {

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    let isListening = false;

    // 🎤 Start mic on ANY click (only once)
    document.body.addEventListener("click", () => {
        if (!isListening) {
            recognition.start();
            isListening = true;
            console.log("🎤 Voice system activated");
        }
    }, { once: true });

    recognition.onstart = () => {
        console.log("🎤 Listening for keywords...");
    };

    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript
            .trim()
            .toLowerCase();

        console.log("Heard:", transcript);

        // 🔥 KEYWORD DETECTION
        if (transcript.includes("help") || transcript.includes("emergency")) {
            console.log("🚨 Keyword detected!");

            // Try to get location if map available
            if (typeof userMarker !== "undefined" && userMarker) {
                const pos = userMarker.getLatLng();
                triggerVoiceSOS(pos.lat, pos.lng);
            } else {
                triggerVoiceSOS(null, null);
            }
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech error:", event.error);
    };

    recognition.onend = () => {
        // restart listening automatically
        if (isListening) {
            recognition.start();
        }
    };
}


// 🚨 SOS FUNCTION
function triggerVoiceSOS(lat, lng) {

    console.log("🚨 VOICE SOS TRIGGERED");

    if (lat && lng) {
        console.log(`Location: ${lat}, ${lng}`);
    }

    // Popup
    alert("🚨 VOICE SOS ACTIVATED!");

    // Update map marker if available
    if (typeof userMarker !== "undefined" && userMarker) {
        userMarker.bindPopup("🚨 VOICE SOS ACTIVE!").openPopup();
    }
}