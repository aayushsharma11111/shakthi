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

// ---------------- AMENITY FETCH ----------------

function getClosestPlace(userLat, userLng, places) {
  let closest = null;
  let minDistance = Infinity;

  for (let place of places) {
    if (!place.lat || !place.lon) continue;
    
    // Haversine formula for accurate distance comparison
    const dLat = (place.lat - userLat) * Math.PI / 180;
    const dLon = (place.lon - userLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLat * Math.PI / 180) * Math.cos(place.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const distance = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); // meters

    if (distance < minDistance) {
      minDistance = distance;
      closest = place;
    }
  }
  return closest;
}

async function getNearestAmenity(lat, lng, amenityType, radiusIndex = 0) {
  const radii = [5000, 8000, 10000];
  
  if (radiusIndex >= radii.length) {
    return null;
  }
  
  const radius = radii[radiusIndex];
  
  // Request all nodes inside radius by removing "out 1"
  const query = `[out:json];node["amenity"="${amenityType}"](around:${radius},${lat},${lng});out;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Overpass API error");
    const data = await response.json();

    // Execute the requested 3-second delay strictly post-fetch before parsing arrays
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (data && data.elements && data.elements.length > 0) {
      const closestStation = getClosestPlace(lat, lng, data.elements);
      if (closestStation) {
        // Stop searching immediately upon finding closest valid node
        return [closestStation.lat, closestStation.lon];
      }
    }
    
    console.warn(`No ${amenityType} found at ${radius}m, expanding search...`);
    return await getNearestAmenity(lat, lng, amenityType, radiusIndex + 1);
    
  } catch (error) {
    console.warn(`Fetch failed for ${amenityType} at ${radius}m, expanding search...`);
    // Retry promptly on fail to avoid freezing user flow
    return await getNearestAmenity(lat, lng, amenityType, radiusIndex + 1);
  }
}

// Keep backward compatibility for other modules if relying on this function name
async function getNearestPoliceStation(lat, lng) {
  return await getNearestAmenity(lat, lng, 'police');
}

// ---------------- ROUTING ----------------

let destinationMarker = null;

async function getSafeRoute(type = 'police') {
  const { userCoords } = appState;
  if (!userCoords) return alert("Waiting for location...");

  const routeBtn = type === 'hospital' ? document.getElementById('routeBtnHospital') : document.getElementById('routeBtnPolice');
  const originalText = routeBtn ? routeBtn.innerHTML : '';
  
  if (routeBtn) {
    routeBtn.disabled = true;
    routeBtn.innerHTML = `🔍 Searching nearby ${type === 'hospital' ? 'hospitals' : 'police stations'}...`;
  }

  const stationCoords = await getNearestAmenity(userCoords[0], userCoords[1], type);
  
  if (routeBtn) {
    routeBtn.disabled = false;
    routeBtn.innerHTML = originalText;
  }

  if (!stationCoords) {
    alert(`⚠️ No ${type} found nearby.`);
    return;
  }

  appState.destination = stationCoords;

  if (destinationMarker) {
    map.removeLayer(destinationMarker);
  }
  
  const iconColor = type === 'hospital' ? '#e94560' : '#4585e9';
  const iconMarkup = `<div style="background-color:${iconColor}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>`;
  const customIcon = L.divIcon({
    className: '',
    html: iconMarkup,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  const title = type === 'hospital' ? 'Nearest Hospital' : 'Nearest Police Station';

  destinationMarker = L.marker(stationCoords, { icon: customIcon }).addTo(map)
    .bindPopup(`<b>${title}</b>`).openPopup();

  const url = `https://router.project-osrm.org/route/v1/foot/${userCoords[1]},${userCoords[0]};${stationCoords[1]},${stationCoords[0]}?overview=full&geometries=geojson`;

  alert(`Routing to ${title}...`);

  try {
    const r = await fetch(url);
    const data = await r.json();
    const coords = data.routes[0].geometry.coordinates;
    const latLngs = coords.map(c => [c[1], c[0]]);

    if (appState.routeLayer) {
      map.removeLayer(appState.routeLayer);
    }

    const routeColor = type === 'hospital' ? '#f87171' : '#60a5fa';
    appState.routeLayer = L.polyline(latLngs, {
      color: routeColor,
      weight: 5
    }).addTo(map);

    map.fitBounds(appState.routeLayer.getBounds());

    document.getElementById("route-info").style.display = "block";
    
    // Update stats from route data if available
    if (data.routes && data.routes.length > 0) {
      const distKm = (data.routes[0].distance / 1000).toFixed(2);
      const timeMin = Math.ceil(data.routes[0].duration / 60);
      document.getElementById("stat-dist").textContent = `${distKm} km`;
      document.getElementById("stat-time").textContent = `${timeMin} min`;
    } else {
      document.getElementById("stat-dist").textContent = "Route ready";
    }

    alert(`✅ Safe route to ${title} loaded`);
  } catch (e) {
    console.error("Routing error:", e);
    alert("⚠️ Routing failed");
  }
}

// ---------------- CLEAR ROUTE ----------------

function clearRoute() {
  if (appState.routeLayer) {
    map.removeLayer(appState.routeLayer);
    appState.routeLayer = null;
  }

  if (destinationMarker) {
    map.removeLayer(destinationMarker);
    destinationMarker = null;
  }

  document.getElementById("route-info").style.display = "none";
  alert("Route cleared");
}