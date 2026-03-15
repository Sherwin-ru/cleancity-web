// js/database.js
// LocalStorage Database Helpers

// --- Storage Utilities ---
function getStorage(key, defaultVal) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : (defaultVal || []);
}

function setStorage(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

/**
 * Handle errors (simplified for LocalStorage)
 */
function handleDbError(error, context) {
  if (error) {
    console.error(`Database error in ${context}:`, error);
    throw new Error(error.message);
  }
}

/**
 * Create a new pickup request
 */
async function createPickupRequest(userId, wasteType, quantity, lat, lng, locationName, scheduledTime) {
  const requests = getStorage('pickupRequests');
  const newRequest = {
    id: 'req_' + Math.random().toString(36).substr(2, 9),
    userId: userId,
    wasteType: wasteType,
    quantity: quantity,
    lat: lat,
    lng: lng,
    locationName: locationName || 'Unknown location',
    status: 'pending',
    scheduledTime: new Date(scheduledTime).toISOString(),
    createdAt: new Date().toISOString()
  };
  requests.push(newRequest);
  setStorage('pickupRequests', requests);
  return newRequest.id;
}

/**
 * Get last 10 requests for a user
 */
async function getUserRequests(userId) {
  const requests = getStorage('pickupRequests');
  const collectors = getStorage('collectors');
  
  return requests
    .filter(r => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)
    .map(r => {
      if (r.collectorId) {
        const c = collectors.find(coll => coll.id === r.collectorId);
        if (c) r.collectors = c;
      }
      return r;
    });
}

/**
 * Get all pending pickup requests
 */
async function getAllPendingRequests() {
  const requests = getStorage('pickupRequests');
  return requests
    .filter(r => r.status === 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get all requests (optionally filtered by status)
 */
async function getAllRequests(statusFilter) {
  const requests = getStorage('pickupRequests');
  let filtered = requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter(r => r.status === statusFilter);
  }
  return filtered;
}

/**
 * Assign a collector to a pickup request
 */
async function assignCollector(requestId, collectorId) {
  const requests = getStorage('pickupRequests');
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx !== -1) {
    requests[idx].status = 'assigned';
    requests[idx].collectorId = collectorId;
    setStorage('pickupRequests', requests);
  }
}

/**
 * Mark a request as completed, increment green points, add to history
 */
async function completeRequest(requestId, userId, wasteType) {
  const pointsMap = { 'Solid': 15, 'Bio-waste': 20, 'E-waste': 25 };
  const points = pointsMap[wasteType] || 10;

  // 1. Update request status
  const requests = getStorage('pickupRequests');
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx !== -1) {
    requests[idx].status = 'completed';
    requests[idx].completedAt = new Date().toISOString();
    setStorage('pickupRequests', requests);
  }

  // 2. Increment user's green points
  const users = getStorage('users', {});
  if (users[userId]) {
    users[userId].greenPoints = (users[userId].greenPoints || 0) + points;
    setStorage('users', users);
  }

  // 3. Add to points history
  const history = getStorage('pointsHistory');
  history.push({
    id: 'pt_' + Math.random().toString(36).substr(2, 9),
    userId: userId,
    action: wasteType + ' waste pickup completed',
    points: points,
    createdAt: new Date().toISOString()
  });
  setStorage('pointsHistory', history);
}

/**
 * Get analytics data
 */
async function getAnalyticsData(zone, days) {
  const requests = getStorage('pickupRequests');
  const since = new Date();
  since.setDate(since.getDate() - days);

  return requests.filter(r => new Date(r.createdAt) >= since);
}

/**
 * Listen to pickup requests in real-time
 */
function listenToRequests(callback) {
  // Initial fetch
  getAllRequests('all').then(callback);

  // Poll localStorage to simulate real-time
  const interval = setInterval(() => {
    getAllRequests('all').then(callback);
  }, 2000);

  return () => clearInterval(interval);
}

/**
 * Get user data by UID
 */
async function getUserData(uid) {
  const users = getStorage('users', {});
  return users[uid] || null;
}

/**
 * Create or update user
 */
async function createOrUpdateUser(uid, userData) {
  const users = getStorage('users', {});
  users[uid] = { ...users[uid], ...userData, id: uid };
  setStorage('users', users);
}

/**
 * Get all collectors
 */
async function getCollectors() {
  return getStorage('collectors');
}

/**
 * Get active collectors
 */
async function getActiveCollectors() {
  let collectors = getStorage('collectors');
  
  // Seed demo collectors if empty
  if (collectors.length === 0) {
    collectors = [
      { id: 'c1', name: 'John Doe', vehicleNumber: 'Truck A1', zone: 'Zone-A', isActive: true, currentLat: 20.6, currentLng: 78.9 },
      { id: 'c2', name: 'Jane Smith', vehicleNumber: 'Van B2', zone: 'Zone-B', isActive: true, currentLat: 20.5, currentLng: 79.0 }
    ];
    setStorage('collectors', collectors);
  }
  return collectors.filter(c => c.isActive);
}

/**
 * Get collector by ID
 */
async function getCollector(collectorId) {
  const collectors = getStorage('collectors');
  return collectors.find(c => c.id === collectorId) || null;
}

/**
 * Get user's points history
 */
async function getPointsHistory(uid) {
  const history = getStorage('pointsHistory');
  return history
    .filter(h => h.userId === uid)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);
}

/**
 * Get request counts
 */
async function getRequestCounts() {
  const reqs = await getAllRequests('all');
  const counts = { pending: 0, assigned: 0, completed: 0, total: 0 };
  reqs.forEach(doc => {
    const status = doc.status;
    if (counts.hasOwnProperty(status)) {
      counts[status]++;
    }
    counts.total++;
  });
  return counts;
}

/**
 * Show toast
 */
function showToast(message, duration) {
  duration = duration || 3000;
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function() {
    toast.classList.remove('show');
  }, duration);
}

/**
 * Auth check
 */
function requireAuth(callback) {
  const isInSubfolder = window.location.pathname.includes('/citizen/') || window.location.pathname.includes('/authority/');
  const loginUrl = isInSubfolder ? '../index.html' : 'index.html';

  const userJson = localStorage.getItem('currentUser');
  if (!userJson) {
    window.location.href = loginUrl;
  } else {
    if (callback) callback(JSON.parse(userJson));
  }
}
