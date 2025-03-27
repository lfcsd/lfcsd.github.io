// Admin Panel Functions
document.addEventListener('DOMContentLoaded', function() {
  const auth = firebase.auth();
  const loginForm = document.getElementById('loginForm');
  const loginContainer = document.getElementById('loginContainer');
  const adminPanel = document.getElementById('adminPanel');

  // Login handler
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const token = await userCredential.user.getIdTokenResult();
      
      if (token.claims.admin) {
        loginContainer.style.display = 'none';
        adminPanel.style.display = 'block';
      } else {
        throw new Error('Not an admin user');
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
      auth.signOut();
    }
  });

  // Auto-login if already authenticated
  auth.onAuthStateChanged(async user => {
    if (user) {
      const token = await user.getIdTokenResult();
      if (token.claims.admin) {
        loginContainer.style.display = 'none';
        adminPanel.style.display = 'block';
      }
    }
  });
});

// Current Day Controls
function setDay(day) {
  updateSettings('current', {
    manualDay: day,
    autoMode: false
  }, "Today's day set to " + day);
}

function setSchedule(type) {
  updateSettings('current', {
    schedule: type
  }, "Today's schedule set to " + type);
}

function resetToAuto() {
  updateSettings('current', {
    manualDay: null,
    schedule: "Regular Day",
    autoMode: true
  }, "Today's schedule reset to automatic");
}

// Next Day Controls
function setNextDay(day) {
  updateSettings('nextDayOverride', {
    manualDay: day,
    autoMode: false
  }, "Next day set to " + day);
}

function setNextSchedule(type) {
  updateSettings('nextDayOverride', {
    schedule: type
  }, "Next day schedule set to " + type);
}

function resetNextToAuto() {
  updateSettings('nextDayOverride', {
    manualDay: null,
    schedule: "Regular Day",
    autoMode: true
  }, "Next day reset to automatic");
}

// Shared function
function updateSettings(docName, updates, successMessage) {
  const db = firebase.firestore();
  db.collection("settings").doc(docName).set(updates, { merge: true })
    .then(() => alert(successMessage))
    .catch(error => alert("Error: " + error.message));
}

function logout() {
  firebase.auth().signOut()
    .then(() => window.location.reload());
}
