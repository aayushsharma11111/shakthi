// Police locations
const police = [
    { name: "City Police", lat: 17.6599, lng: 75.9064 },
    { name: "Police Station 2", lat: 17.6620, lng: 75.9100 }
];

// Hospitals
const hospitals = [
    { name: "Hospital 1", lat: 17.6580, lng: 75.9040 },
    { name: "Hospital 2", lat: 17.6610, lng: 75.9080 }
];

// Function to add markers
function addNearbyServices(map) {
    police.forEach(p => {
        L.marker([p.lat, p.lng]).addTo(map)
        .bindPopup("🚓 " + p.name);
    });

    hospitals.forEach(h => {
        L.marker([h.lat, h.lng]).addTo(map)
        .bindPopup("🏥 " + h.name);
    });
}