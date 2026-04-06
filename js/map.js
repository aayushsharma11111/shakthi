const map = L.map('map').setView([12.9716, 77.5946], 14);
appState.map = map;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Draw danger zones
appState.dangerZones.forEach(z => {
  L.circle(z.pos, {
    color: z.level === 'high' ? '#e94560' : '#f59e0b',
    fillOpacity: 0.2,
    radius: 200
  }).addTo(map);
});

// Get location
navigator.geolocation.getCurrentPosition(pos => {
  appState.userCoords = [pos.coords.latitude, pos.coords.longitude];

  L.marker(appState.userCoords).addTo(map);
  map.setView(appState.userCoords, 15);

  updateRisk();
  toast("📍 Location detected");
});

// Routing
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

function clearRoute() {
  if (appState.routeLayer) {
    map.removeLayer(appState.routeLayer);
    appState.routeLayer = null;
  }

  document.getElementById("route-info").style.display = "none";
  toast("Route cleared");
}