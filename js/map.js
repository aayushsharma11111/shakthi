// 1. Initialize the map with a fallback view (Bengaluru)
const map = L.map('map').setView([12.9716, 77.5946], 15);

// 2. Add the OpenStreetMap visual tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 3. Define variables for the user's marker and accuracy circle
let userMarker, userCircle;

// --- STEP 8.1: DEFINE & DRAW GEOFENCED ZONES ---

// Hardcoded Danger Zones (Red)
const dangerZones = [
    { coords: [12.9750, 77.5850], radius: 300, label: "High Risk Area: Poor Lighting" },
    { coords: [12.9650, 77.6000], radius: 250, label: "Danger Zone: Reported Incident" }
];

// Hardcoded Safe Zones (Green)
const safeZones = [
    { coords: [12.9716, 77.5946], radius: 200, label: "Safe Zone: Police Station" },
    { coords: [12.9800, 77.5900], radius: 150, label: "Safe Zone: 24/7 Pharmacy" }
];

// Draw Danger Zones on Map
dangerZones.forEach(zone => {
    L.circle(zone.coords, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.4,
        radius: zone.radius
    }).addTo(map).bindPopup(`<b>Danger!</b><br>${zone.label}`);
});

// Draw Safe Zones on Map
safeZones.forEach(zone => {
    L.circle(zone.coords, {
        color: 'green',
        fillColor: '#28a745',
        fillOpacity: 0.4,
        radius: zone.radius
    }).addTo(map).bindPopup(`<b>Safe Zone</b><br>${zone.label}`);
});

// --- STEP 8.1: ZONE CHECKING LOGIC FOR M2 ---

/**
 * checkZone(lat, lng)
 * Used by M2's Risk Engine to determine current safety status
 */
function checkZone(lat, lng) {
    const userLatLng = L.latLng(lat, lng);
    
    // Check Danger Zones
    for (let zone of dangerZones) {
        if (userLatLng.distanceTo(L.latLng(zone.coords)) <= zone.radius) {
            return "danger";
        }
    }

    // Check Safe Zones
    for (let zone of safeZones) {
        if (userLatLng.distanceTo(L.latLng(zone.coords)) <= zone.radius) {
            return "safe";
        }
    }

    return "neutral";
}

// --- LIVE LOCATION ENGINE ---

function onLocationUpdate(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    // Log the current zone status for debugging
    console.log("Current Zone Status:", checkZone(lat, lng));

    if (!userMarker) {
        userMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup("<b>Shakthi Safety System</b><br>Live Tracking Active").openPopup();
        
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

    map.panTo([lat, lng]);
}

function onLocationError(error) {
    console.warn(`ERROR(${error.code}): ${error.message}`);
    if (error.code === 1) {
        alert("Please allow location access to use the safety map.");
    }
}

if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(onLocationUpdate, onLocationError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
} else {
    alert("Geolocation is not supported by this browser.");
}