// js/maps.js
// ═══════════════════════════════════════════════
// Leaflet.js + OSRM Route Helpers
// ═══════════════════════════════════════════════

/**
 * Initialize a Leaflet map with OpenStreetMap tiles
 */
function initMap(containerId, lat, lng, zoom) {
  var map = L.map(containerId).setView([lat, lng], zoom || 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  return map;
}

/**
 * Add a pickup location marker (green square, neo-brutalism style)
 */
function addPickupMarker(map, lat, lng, label) {
  var icon = L.divIcon({
    className: 'pickup-marker-icon',
    html: '<div style="' +
      'width:32px;height:32px;' +
      'background:#1D9E75;' +
      'border:2.5px solid #0A0A0A;' +
      'box-shadow:3px 3px 0 #0A0A0A;' +
      'display:flex;align-items:center;justify-content:center;' +
      'color:white;font-weight:800;font-size:14px;' +
      'font-family:Space Grotesk,sans-serif;' +
      '">' + (label || '📍') + '</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  return L.marker([lat, lng], { icon: icon }).addTo(map);
}

/**
 * Add a collector marker (yellow, pulsing animation)
 */
function addCollectorMarker(map, lat, lng) {
  var icon = L.divIcon({
    className: 'collector-marker-icon',
    html: '<div class="collector-marker" style="' +
      'width:24px;height:24px;' +
      'background:#FFE566;' +
      'border:3px solid #0A0A0A;' +
      'animation:pulse 1.5s infinite;' +
      '"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return L.marker([lat, lng], { icon: icon }).addTo(map);
}

/**
 * Add a numbered waypoint marker
 */
function addNumberedMarker(map, lat, lng, number) {
  var icon = L.divIcon({
    className: 'numbered-marker-icon',
    html: '<div style="' +
      'width:28px;height:28px;' +
      'background:#1A6BFF;' +
      'border:2.5px solid #0A0A0A;' +
      'box-shadow:2px 2px 0 #0A0A0A;' +
      'display:flex;align-items:center;justify-content:center;' +
      'color:white;font-weight:800;font-size:13px;' +
      'font-family:Space Grotesk,sans-serif;' +
      '">' + number + '</div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28]
  });

  return L.marker([lat, lng], { icon: icon }).addTo(map);
}

/**
 * Add a heatmap circle marker
 */
function addHeatCircle(map, lat, lng, radius, color) {
  return L.circleMarker([lat, lng], {
    radius: radius || 20,
    fillColor: color || '#1D9E75',
    color: '#0A0A0A',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.75
  }).addTo(map);
}

/**
 * Get driving route from OSRM
 */
async function getRoute(fromLat, fromLng, toLat, toLng) {
  var url = 'https://router.project-osrm.org/route/v1/driving/' +
    fromLng + ',' + fromLat + ';' + toLng + ',' + toLat +
    '?overview=full&geometries=geojson';

  try {
    var response = await fetch(url);
    var data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      var coords = data.routes[0].geometry.coordinates;
      return coords.map(function(c) { return [c[1], c[0]]; });
    }
  } catch (e) {
    console.error('OSRM route error:', e);
  }
  return [];
}

/**
 * Get optimized trip from OSRM Trip API
 */
async function getOptimizedTrip(waypointsArray) {
  if (!waypointsArray || waypointsArray.length < 2) {
    return { orderedWaypoints: waypointsArray || [], routeCoordinates: [] };
  }

  var coordString = waypointsArray.map(function(wp) {
    return wp.lng + ',' + wp.lat;
  }).join(';');

  var url = 'https://router.project-osrm.org/trip/v1/driving/' + coordString +
    '?roundtrip=true&source=first&destination=last&geometries=geojson';

  try {
    var response = await fetch(url);
    var data = await response.json();

    if (data.code === 'Ok' && data.trips && data.trips.length > 0) {
      var trip = data.trips[0];
      var routeCoords = trip.geometry.coordinates.map(function(c) {
        return [c[1], c[0]];
      });

      var orderedWaypoints = data.waypoints
        .sort(function(a, b) { return a.waypoint_index - b.waypoint_index; })
        .map(function(wp) {
          return {
            lat: wp.location[1],
            lng: wp.location[0],
            waypointIndex: wp.waypoint_index
          };
        });

      return {
        orderedWaypoints: orderedWaypoints,
        routeCoordinates: routeCoords,
        distance: trip.distance,
        duration: trip.duration
      };
    }
  } catch (e) {
    console.error('OSRM trip error:', e);
  }

  return { orderedWaypoints: waypointsArray, routeCoordinates: [] };
}

/**
 * Reverse geocode coordinates to address using Nominatim
 */
async function reverseGeocode(lat, lng) {
  var url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng;

  try {
    var response = await fetch(url, {
      headers: { 'User-Agent': 'CleanCity-Web/1.0' }
    });
    var data = await response.json();
    return data.display_name || ('Lat: ' + lat.toFixed(5) + ', Lng: ' + lng.toFixed(5));
  } catch (e) {
    console.error('Reverse geocode error:', e);
    return 'Lat: ' + lat.toFixed(5) + ', Lng: ' + lng.toFixed(5);
  }
}

/**
 * Draw a polyline route on the map
 */
function drawRoute(map, coordinates, color) {
  return L.polyline(coordinates, {
    color: color || '#1D9E75',
    weight: 5,
    opacity: 0.85
  }).addTo(map);
}
