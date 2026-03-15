// js/auth.js
// LocalStorage Auth Simulation

async function loginWithEmail(email, password) {
  try {
    // In simulation mode, every login succeeds.
    // If user doesn't exist in 'users' storage, they'll be created by the caller in index.html.
    const user = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      email: email,
      user_metadata: { full_name: email.split('@')[0] }
    };
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    return { success: true, user: user, isNew: false };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function loginWithGoogle() {
  try {
    const user = {
      id: 'google_' + Math.random().toString(36).substr(2, 9),
      email: 'googleuser@example.com',
      user_metadata: { full_name: 'Google User' }
    };
    localStorage.setItem('currentUser', JSON.stringify(user));
    // Simulate redirect delay
    return new Promise(resolve => {
      setTimeout(() => resolve({ success: true }), 500);
    });
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function logout() {
  try {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('pendingAuthRole');
    return true;
  } catch (e) {
    console.error('Logout error:', e);
    return false;
  }
}

async function getCurrentUser() {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}
