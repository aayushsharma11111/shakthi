// Initialize map
const map = L.map('map').setView([12.9716, 77.5946], 15);
appState.map = map;

// Tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// User marker
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
  }).addTo(map);
});

safeZones.forEach(zone => {
  L.circle(zone.coords, {
    color: 'green',
    fillOpacity: 0.3,
    radius: zone.radius
  }).addTo(map);
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
    userMarker = L.marker([lat, lng]).addTo(map);
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

  updateRisk();
}

// Start tracking
navigator.geolocation.watchPosition(onLocationUpdate);

// ---------------- ROUTING ----------------

function getSafeRoute() {
  const { userCoords, destination } = appState;
  if (!userCoords) return toast("Waiting for location...");

  const url = `https://router.project-osrm.org/route/v1/foot/${userCoords[1]},${userCoords[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;

  toast("Routing...");

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

      toast("✅ Safe route loaded");
    })
    .catch(() => toast("⚠️ Routing failed"));
}

// ---------------- CLEAR ROUTE ----------------

function clearRoute() {
  if (appState.routeLayer) {
    map.removeLayer(appState.routeLayer);
    appState.routeLayer = null;
  }

  document.getElementById("route-info").style.display = "none";
  toast("Route cleared");
}