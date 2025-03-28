document.addEventListener('DOMContentLoaded', function() {
  const auth = firebase.auth();
  const loginForm = document.getElementById('loginForm');
  const loginContainer = document.getElementById('loginContainer');
  const adminPanel = document.getElementById('adminPanel');


 // DOM Elements
  const loginForm = document.getElementById('loginForm');
  const loginContainer = document.getElementById('loginContainer');
  const adminPanel = document.getElementById('adminPanel');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

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
        throw new Error('Not an admin');
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
      auth.signOut();
    }
  });

  // Check if already logged in
  auth.onAuthStateChanged(async function(user) {
    if (user) {
      const token = await user.getIdTokenResult();
      if (token.claims.admin) {
        loginContainer.style.display = 'none';
        adminPanel.style.display = 'block';
      }
    }
  });
});

// Admin functions
async function setDay(type, day) {
  try {
    await firebase.firestore().collection("settings").doc(type).update({
      manualDay: day,
      autoMode: false,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert(`Set ${type} day to ${day}`);
  } catch (error) {
    alert(`Error updating ${type} day: ` + error.message);
  }
}

async function setSchedule(type, schedule) {
  try {
    await firebase.firestore().collection("settings").doc(type).update({
      schedule: schedule,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert(`Set ${type} schedule to ${schedule}`);
  } catch (error) {
    alert(`Error updating ${type} schedule: ` + error.message);
  }
}

async function resetAuto(type) {
  try {
    await firebase.firestore().collection("settings").doc(type).update({
      manualDay: null,
      schedule: "Regular Day",
      autoMode: true,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert(`Reset ${type} to automatic`);
  } catch (error) {
    alert(`Error resetting ${type}: ` + error.message);
  }
}

async function setAnnouncement() {
  const message = document.getElementById('announcementText').value.trim();
  const color = document.getElementById('announcementColor').value.trim() || '#6a0dad';
  
  if (!message) {
    alert('Please enter an announcement message');
    return;
  }

  // Validate hex color
  if (!/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
    alert('Please enter a valid hex color (e.g., #6a0dad)');
    return;
  }

  try {
    await firebase.firestore().collection("announcements").doc("current").set({
      message: message,
      color: color,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert('Announcement set successfully!\nIt will appear immediately on all devices.');
  } catch (error) {
    console.error("Error:", error);
    alert('Error: ' + error.message);
  }
}

async function clearAnnouncement() {
  try {
    await firebase.firestore().collection("announcements").doc("current").delete();
    document.getElementById('announcementText').value = '';
    document.getElementById('announcementColor').value = '#6a0dad';
    alert('Announcement cleared successfully!\nIt will disappear immediately from all devices.');
  } catch (error) {
    console.error("Error:", error);
    alert('Error: ' + error.message);
  }
}

// Add this to your existing auth check to pre-load current announcement
auth.onAuthStateChanged(async (user) => {
  if (user && (await user.getIdTokenResult()).claims.admin) {
    // Load current announcement if exists
    const doc = await firebase.firestore().collection("announcements").doc("current").get();
    if (doc.exists) {
      document.getElementById('announcementText').value = doc.data().message || '';
      document.getElementById('announcementColor').value = doc.data().color || '#6a0dad';
    }
