// 1. Initialize the map with a fallback view (Bengaluru)
// This shows immediately while the GPS is searching
const map = L.map('map').setView([12.9716, 77.5946], 15);

// 2. Add the OpenStreetMap visual tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 3. Define variables for the user's marker and accuracy circle
let userMarker, userCircle;

// 4. Function to update location on the map
function onLocationUpdate(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    // If marker doesn't exist, create it. If it does, move it.
    if (!userMarker) {
        userMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup("<b>Shakthi Safety System</b><br>Live Tracking Active").openPopup();
        
        // Add a light blue circle to show GPS accuracy range
        userCircle = L.circle([lat, lng], {
            radius: accuracy,
            color: '#3388ff',
            fillColor: '#3388ff',
            fillOpacity: 0.1
        }).addTo(map);
    } else {
        userMarker.setLatLng([lat, lng]);
        userCircle.setLatLng([lat, lng]).setRadius(accuracy);
    }

    // Smoothly pan the map to the user's new position
    map.panTo([lat, lng]);
}

// 5. Function to handle GPS errors
function onLocationError(error) {
    console.warn(`ERROR(${error.code}): ${error.message}`);
    if (error.code === 1) {
        alert("Please allow location access to use the safety map.");
    }
}

// 6. Start the High-Accuracy Watch Engine
if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(onLocationUpdate, onLocationError, {
        enableHighAccuracy: true, // Uses GPS/Wi-Fi for best precision
        timeout: 10000,           // Wait 10 seconds for a signal
        maximumAge: 0             // Force fresh data, no caching
    });
} else {
    alert("Geolocation is not supported by this browser.");
}