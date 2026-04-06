// ---------------- INIT MAP ----------------
const map = L.map('map').setView([12.9716, 77.5946], 15);
appState.map = map;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let userMarker, userCircle;

// ---------------- ZONES ----------------

// Danger Zones
const dangerZones = [
  { coords: [12.9750, 77.5850], radius: 300, label: "High Risk Area" },
  { coords: [12.9650, 77.6000], radius: 250, label: "Danger Zone" }
];

// Safe Zones
const safeZones = [
  { coords: [12.9716, 77.5946], radius: 200, label: "Safe Zone" },
  { coords: [12.9800, 77.5900], radius: 150, label: "Safe Zone" }
];

// Draw zones
dangerZones.forEach(zone => {
  L.circle(zone.coords, {
    color: 'red',
    fillOpacity: 0.3,
    radius: zone.radius
  }).addTo(map).bindPopup(`<b>Danger</b><br>${zone.label}`);
});

safeZones.forEach(zone => {
  L.circle(zone.coords, {
    color: 'green',
    fillOpacity: 0.3,
    radius: zone.radius
  }).addTo(map).bindPopup(`<b>Safe</b><br>${zone.label}`);
});

// ---------------- ZONE CHECK ----------------

function checkZone(lat, lng) {
  const userLatLng = L.latLng(lat, lng);

  for (let zone of dangerZones) {
    if (userLatLng.distanceTo(L.latLng(zone.coords)) <= zone.radius) {
      return "danger";
    }
  }

  for (let zone of safeZones) {
    if (userLatLng.distanceTo(L.latLng(zone.coords)) <= zone.radius) {
      return "safe";
    }
  }

  return "neutral";
}

// ---------------- LOCATION TRACKING ----------------

function onLocationUpdate(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const accuracy = position.coords.accuracy;

  appState.userCoords = [lat, lng];

  console.log("Zone:", checkZone(lat, lng));

  if (!userMarker) {
    userMarker = L.marker([lat, lng]).addTo(map)
      .bindPopup("<b>Your Location</b>").openPopup();

    userCircle = L.circle([lat, lng], {
      radius: accuracy,
      color: '#3388ff',
      fillOpacity: 0.1
    }).addTo(map);
  } else {
    userMarker.setLatLng([lat, lng]);
    userCircle.setLatLng([lat, lng]).setRadius(accuracy);
  }

  map.panTo([lat, lng]);

  updateRisk(); // from riskEngine.js
}

function onLocationError(error) {
  console.warn(error.message);
  alert("Please enable location access.");
}

// Start tracking
if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(onLocationUpdate, onLocationError, {
    enableHighAccuracy: true
  });
}

// ---------------- ROUTING ----------------

function getSafeRoute() {
  const { userCoords, destination } = appState;
  if (!userCoords) return alert("Waiting for location...");

  const url = `https://router.project-osrm.org/route/v1/foot/${userCoords[1]},${userCoords[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;

  alert("Routing...");

  fetch(url)
    .then(r => r.json())
    .then(data => {
      const coords = data.routes[0].geometry.coordinates;
      const latLngs = coords.map(c => [c[1], c[0]]);

      if (appState.routeLayer) {
        map.removeLayer(appState.routeLayer);
      }

      appState.routeLayer = L.polyline(latLngs, {
        color: '#60a5fa',
        weight: 5
      }).addTo(map);

      map.fitBounds(appState.routeLayer.getBounds());

      document.getElementById("route-info").style.display = "block";
      document.getElementById("stat-dist").textContent = "Route ready";

      alert("✅ Safe route loaded");
    })
    .catch(() => alert("⚠️ Routing failed"));
}

// ---------------- CLEAR ROUTE ----------------

function clearRoute() {
  if (appState.routeLayer) {
    map.removeLayer(appState.routeLayer);
    appState.routeLayer = null;
  }

  document.getElementById("route-info").style.display = "none";
  alert("Route cleared");
}